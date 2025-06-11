import Space from "@core/spaces/Space";
import type { SpaceConnection } from "./SpaceConnection";
import uuid from "@core/uuid/uuid";
import { Backend } from "@core/spaces/Backend";
import { getTreeOps, appendTreeOps, getAllSecrets, saveAllSecrets } from "$lib/localDb";
import type { VertexOperation } from "reptree";
import { RepTree, isAnyPropertyOp } from "reptree";
import AppTree from "@core/spaces/AppTree";

export class InBrowserSpaceSync implements SpaceConnection {
  private _space: Space;
  private _connected: boolean = false;
  private _backend: Backend | undefined;
  private saveScheduled = false;
  private savingOpsToDatabase = false;
  private treeOpsToSave: Map<string, VertexOperation[]> = new Map();
  private secretsToSave: Record<string, string> | undefined;
  private secretsDirty = false;

  constructor(space: Space) {
    this._space = space;

    // Observe operations from the main space tree
    space.tree.observeOpApplied((op) => {
      this.handleOpAppliedFromSamePeer(space.tree, op);
    });

    // Handle new app trees
    space.observeNewAppTree((appTreeId) => {
      this.handleNewAppTree(appTreeId);
    });

    // Handle loaded app trees
    space.observeTreeLoad((appTreeId) => {
      this.handleLoadAppTree(appTreeId);
    });

    // Register tree loader for app trees
    space.registerTreeLoader(async (appTreeId) => {
      try {
        const spaceId = this._space.getId();
        const ops = await getTreeOps(spaceId, appTreeId);
        
        if (ops.length === 0) {
          return undefined;
        }

        const tree = new RepTree(uuid(), ops);
        return new AppTree(tree);
      } catch (error) {
        console.error("Error loading app tree", appTreeId, error);
        return undefined;
      }
    });

    // Track secrets changes by wrapping the space's setSecret and saveAllSecrets methods
    this.wrapSecretsMethod();
  }

  private wrapSecretsMethod() {
    const originalSetSecret = this._space.setSecret.bind(this._space);
    const originalSaveAllSecrets = this._space.saveAllSecrets.bind(this._space);

    this._space.setSecret = (key: string, value: string) => {
      originalSetSecret(key, value);
      this.markSecretsDirty();
    };

    this._space.saveAllSecrets = (secrets: Record<string, string>) => {
      originalSaveAllSecrets(secrets);
      this.markSecretsDirty();
    };
  }

  /**
   * Schedule saving operations at the end of the current frame
   */
  private scheduleSave() {
    if (this.saveScheduled) {
      return; // Save already scheduled for this frame
    }
    
    this.saveScheduled = true;
    requestAnimationFrame(() => {
      this.saveScheduled = false;
      this.saveOps();
    });
  }

  private markSecretsDirty() {
    this.secretsToSave = this._space.getAllSecrets();
    this.secretsDirty = true;
  }

  get space(): Space {
    return this._space;
  }

  get connected(): boolean {
    return this._connected;
  }

  async connect(): Promise<void> {
    if (this._connected) {
      return;
    }

    // Load secrets from database
    await this.loadSecrets();

    this._backend = new Backend(this._space, true);

    this._connected = true;
  }

  async disconnect(): Promise<void> {
    if (!this._connected) {
      return;
    }

    // Save any pending operations and secrets
    await this.saveData();

    this._connected = false;
  }

  private async loadSecrets() {
    try {
      const spaceId = this._space.getId();
      const secrets = await getAllSecrets(spaceId);
      if (secrets) {
        this._space.saveAllSecrets(secrets);
      }
    } catch (error) {
      console.error("Error loading secrets", error);
    }
  }

  private async saveData() {
    await Promise.all([
      this.saveOps(),
      this.saveSecrets()
    ]);
  }

  private async saveSecrets() {
    if (!this.secretsDirty || !this.secretsToSave) {
      return;
    }

    try {
      const spaceId = this._space.getId();
      await saveAllSecrets(spaceId, this.secretsToSave);
      this.secretsDirty = false;
    } catch (error) {
      console.error("Error saving secrets", error);
    }
  }

  private async saveOps() {
    if (this.savingOpsToDatabase) {
      return;
    }

    this.savingOpsToDatabase = true;

    for (const [treeId, ops] of this.treeOpsToSave.entries()) {
      if (ops.length === 0) {
        continue;
      }

      try {
        const spaceId = this._space.getId();
        await appendTreeOps(spaceId, treeId, ops);
        this.treeOpsToSave.set(treeId, []);
      } catch (error) {
        console.error("Error saving ops to database", error);
      }
    }

    this.savingOpsToDatabase = false;
  }

  addOpsToSave(treeId: string, ops: ReadonlyArray<VertexOperation>) {
    let opsToSave = this.treeOpsToSave.get(treeId);
    if (!opsToSave) {
      opsToSave = [];
      this.treeOpsToSave.set(treeId, opsToSave);
    }
    opsToSave.push(...ops);
  }

  private handleOpAppliedFromSamePeer(tree: RepTree, op: VertexOperation) {
    // Important that we don't save ops from other peers here
    if (op.id.peerId !== tree.peerId) {
      return;
    }

    const treeId = tree.root!.id;

    let ops = this.treeOpsToSave.get(treeId);
    if (!ops) {
      ops = [];
      this.treeOpsToSave.set(treeId, ops);
    }

    // Only save move ops or non-transient property ops (so, no transient properties)
    if (!isAnyPropertyOp(op) || !op.transient) {
      ops.push(op);
      // Schedule save at the end of the current frame
      this.scheduleSave();
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
    this.treeOpsToSave.set(appTreeId, ops);

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

export async function createNewInBrowserSpaceSync(): Promise<SpaceConnection> {
  const space = Space.newSpace(uuid());
  const sync = new InBrowserSpaceSync(space);

  // Get all operations that created the space tree and add them to be saved
  const initOps = space.tree.getAllOps();
  sync.addOpsToSave(space.getId(), initOps);

  await sync.connect();
  
  return sync;
}

export async function loadExistingInBrowserSpaceSync(spaceId: string): Promise<SpaceConnection> {
  try {
    // Load operations for the main space tree
    const spaceOps = await getTreeOps(spaceId, spaceId);
    
    if (spaceOps.length === 0) {
      // No operations found - this might be a new space, create it
      console.log(`No operations found for space ${spaceId}, creating new space`);
      const space = Space.newSpace(uuid());
      const sync = new InBrowserSpaceSync(space);
      await sync.connect();
      
      // Save the initial space operations
      const initialOps = space.tree.getAllOps();

      const opsSync = sync as any; // Access private method
      opsSync.addOpsToSave(space.getId(), initialOps);
      
      return sync;
    }
    
    // Create the space from operations
    const space = new Space(new RepTree(uuid(), spaceOps));
    
    const sync = new InBrowserSpaceSync(space);
    await sync.connect();
    return sync;
  } catch (error) {
    console.error(`Failed to load space ${spaceId} from database:`, error);
    throw error;
  }
}