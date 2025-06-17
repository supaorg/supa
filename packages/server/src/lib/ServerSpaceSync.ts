import Space from "@core/spaces/Space";
import { RepTree } from "reptree";
import type { VertexOperation } from "reptree";
import AppTree from "@core/spaces/AppTree";
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Types matching the client-side TreeOperation interface
export interface TreeOperation {
  clock: number;
  peerId: string;
  treeId: string;
  spaceId: string;
  targetId: string;
  parentId?: string;  // For move operations
  key?: string;       // Property key
  value?: any;        // Property value
}

export class ServerSpaceSync {
  private _space: Space;
  private _spaceId: string;
  private _db: Database.Database;
  private _connected: boolean = false;

  constructor(spaceId: string, space: Space, dbPath: string) {
    this._spaceId = spaceId;
    this._space = space;
    this._db = new Database(dbPath);
    
    this.initializeDatabase();
    
    // Observe operations from the main space tree
    space.tree.observeOpApplied((op: VertexOperation) => {
      this.handleOpAppliedFromSamePeer(space.tree, op);
    });

    // Handle new app trees
    space.observeNewAppTree((appTreeId: string) => {
      this.handleNewAppTree(appTreeId);
    });

    // Handle loaded app trees
    space.observeTreeLoad((appTreeId: string) => {
      this.handleLoadAppTree(appTreeId);
    });

    // Register tree loader for app trees
    space.registerTreeLoader(async (appTreeId: string) => {
      try {
        const ops = await this.getTreeOps(appTreeId);
        
        if (ops.length === 0) {
          return undefined;
        }

        const tree = new RepTree(uuidv4(), ops);
        return new AppTree(tree);
      } catch (error) {
        console.error("Error loading app tree", appTreeId, error);
        return undefined;
      }
    });
  }

  private initializeDatabase(): void {
    // Create the tree_ops table matching the schema from the proposal
    this._db.exec(`
      CREATE TABLE IF NOT EXISTS tree_ops (
        clock INTEGER NOT NULL,
        peerId TEXT NOT NULL,
        treeId TEXT NOT NULL,
        spaceId TEXT NOT NULL,
        targetId TEXT NOT NULL,
        parentId TEXT,
        key TEXT,
        value TEXT,
        PRIMARY KEY (clock, peerId, treeId, spaceId)
      );
      
      CREATE INDEX IF NOT EXISTS idx_space_tree ON tree_ops(spaceId, treeId);
      CREATE INDEX IF NOT EXISTS idx_space_tree_clock ON tree_ops(spaceId, treeId, clock);
      
      CREATE TABLE IF NOT EXISTS spaces (
        id TEXT PRIMARY KEY,
        created_at INTEGER
      );
    `);

    // Insert space record if it doesn't exist
    const insertSpace = this._db.prepare(`
      INSERT OR IGNORE INTO spaces (id, created_at) VALUES (?, ?)
    `);
    insertSpace.run(this._spaceId, Date.now());
  }

  get space(): Space {
    return this._space;
  }

  get spaceId(): string {
    return this._spaceId;
  }

  get connected(): boolean {
    return this._connected;
  }

  async connect(): Promise<void> {
    if (this._connected) {
      return;
    }
    this._connected = true;
  }

  async disconnect(): Promise<void> {
    if (!this._connected) {
      return;
    }
    this._db.close();
    this._connected = false;
  }

  // Convert VertexOperation to TreeOperation for storage
  private fromVertexOperation(op: VertexOperation, treeId: string): TreeOperation {
    const base: Partial<TreeOperation> = {
      clock: op.id.counter,
      peerId: op.id.peerId,
      treeId,
      spaceId: this._spaceId,
      targetId: op.targetId
    };

    if ('parentId' in op) {
      return { ...base, parentId: op.parentId } as TreeOperation;
    } else {
      return {
        ...base,
        key: op.key,
        value: JSON.stringify(op.value), // Serialize value for SQLite storage
      } as TreeOperation;
    }
  }

  // Convert TreeOperation to VertexOperation for RepTree
  private toVertexOperation(op: TreeOperation): VertexOperation {
    if (op.parentId !== undefined) {
      // Move operation detected by presence of parentId
      return {
        id: { counter: op.clock, peerId: op.peerId },
        targetId: op.targetId,
        parentId: op.parentId
      } as VertexOperation;
    } else {
      // Property operation detected by presence of key
      return {
        id: { counter: op.clock, peerId: op.peerId },
        targetId: op.targetId,
        key: op.key!,
        value: op.value ? JSON.parse(op.value) : op.value,
      } as VertexOperation;
    }
  }

  // Get operations for a specific tree
  async getTreeOps(treeId: string): Promise<VertexOperation[]> {
    try {
      const stmt = this._db.prepare(`
        SELECT * FROM tree_ops 
        WHERE spaceId = ? AND treeId = ? 
        ORDER BY clock ASC
      `);
      
      const rows = stmt.all(this._spaceId, treeId) as TreeOperation[];
      return rows.map(row => this.toVertexOperation(row));
    } catch (error) {
      console.error(`Failed to get ops for tree ${treeId} in space ${this._spaceId}:`, error);
      return [];
    }
  }

  // Append operations to a specific tree
  async appendTreeOps(treeId: string, ops: readonly VertexOperation[]): Promise<void> {
    if (ops.length === 0) return;

    const stmt = this._db.prepare(`
      INSERT OR REPLACE INTO tree_ops 
      (clock, peerId, treeId, spaceId, targetId, parentId, key, value)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this._db.transaction((operations: TreeOperation[]) => {
      for (const op of operations) {
        stmt.run(
          op.clock,
          op.peerId,
          op.treeId,
          op.spaceId,
          op.targetId,
          op.parentId || null,
          op.key || null,
          op.value || null
        );
      }
    });

    const treeOpsEntries = ops.map(op => this.fromVertexOperation(op, treeId));
    transaction(treeOpsEntries);
  }

  private handleOpAppliedFromSamePeer(tree: RepTree, op: VertexOperation) {
    // Important that we don't save ops from other peers here
    if (op.id.peerId !== tree.peerId) {
      return;
    }

    const treeId = tree.root!.id;

    // Only save move ops or non-transient property ops
    if (!('transient' in op) || !op.transient) {
      this.appendTreeOps(treeId, [op]).catch(error => {
        console.error('Failed to save operation:', error);
      });
    }
  }

  private handleNewAppTree(appTreeId: string) {
    // Add all ops from app tree into the sync
    const appTree = this._space.getAppTree(appTreeId);

    if (!appTree) {
      console.error("App tree not found", appTreeId);
      return;
    }

    const ops = appTree.tree.popLocalOps();
    this.appendTreeOps(appTreeId, ops).catch(error => {
      console.error('Failed to save new app tree ops:', error);
    });

    appTree.tree.observeOpApplied((op) => {
      this.handleOpAppliedFromSamePeer(appTree.tree, op);
    });
  }

  private handleLoadAppTree(appTreeId: string) {
    const appTree = this._space.getAppTree(appTreeId);

    if (!appTree) {
      throw new Error(`App tree with id ${appTreeId} not found`);
    }

    appTree.tree.observeOpApplied((op) => {
      this.handleOpAppliedFromSamePeer(appTree.tree, op);
    });
  }
}

/**
 * Create a new server space with fresh RepTree and save initial operations
 */
export async function createNewServerSpaceSync(spaceId: string, ownerId: string, dataDir: string = './data'): Promise<ServerSpaceSync> {
  // Create directory structure based on UUID partitioning (first 2 chars)
  const partitionDir = path.join(dataDir, spaceId.substring(0, 2));
  if (!fs.existsSync(partitionDir)) {
    fs.mkdirSync(partitionDir, { recursive: true });
  }
  
  const dbPath = path.join(partitionDir, `${spaceId}.db`);
  
  // Create new space with a unique peer ID for the server
  const serverPeerId = `server-${uuidv4()}`;
  const space = Space.newSpace(serverPeerId);
  
  // Create the sync instance
  const sync = new ServerSpaceSync(spaceId, space, dbPath);
  
  // Get all operations that created the space tree and save them
  const initOps = space.tree.getAllOps();
  await sync.appendTreeOps(spaceId, initOps);
  
  await sync.connect();
  
  return sync;
}

/**
 * Load an existing server space from database
 */
export async function loadExistingServerSpaceSync(spaceId: string, dataDir: string = './data'): Promise<ServerSpaceSync> {
  const partitionDir = path.join(dataDir, spaceId.substring(0, 2));
  const dbPath = path.join(partitionDir, `${spaceId}.db`);
  
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Space database not found: ${dbPath}`);
  }
  
  // Create a temporary sync instance to load operations
  const tempDb = new Database(dbPath);
  const stmt = tempDb.prepare(`
    SELECT * FROM tree_ops 
    WHERE spaceId = ? AND treeId = ? 
    ORDER BY clock ASC
  `);
  
  const rows = stmt.all(spaceId, spaceId) as TreeOperation[];
  tempDb.close();
  
  if (rows.length === 0) {
    throw new Error(`No operations found for space ${spaceId}`);
  }
  
  // Convert to VertexOperations
  const spaceOps = rows.map(row => {
    if (row.parentId !== undefined) {
      return {
        id: { counter: row.clock, peerId: row.peerId },
        targetId: row.targetId,
        parentId: row.parentId
      } as VertexOperation;
    } else {
      return {
        id: { counter: row.clock, peerId: row.peerId },
        targetId: row.targetId,
        key: row.key!,
        value: row.value ? JSON.parse(row.value) : row.value,
      } as VertexOperation;
    }
  });
  
  // Create the space from operations with a new server peer ID
  const serverPeerId = `${uuidv4()}`;
  const space = new Space(new RepTree(serverPeerId, spaceOps));
  
  const sync = new ServerSpaceSync(spaceId, space, dbPath);
  await sync.connect();
  
  return sync;
} 