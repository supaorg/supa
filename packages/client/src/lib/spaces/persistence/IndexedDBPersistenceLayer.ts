import type { PersistenceLayer } from "@core/spaces/persistence/PersistenceLayer";
import type { VertexOperation } from "@core";
import { 
  getTreeOps, 
  appendTreeOps, 
  getAllSecrets, 
  saveAllSecrets 
} from "$lib/localDb";

/**
 * One-way persistence layer that saves space and app tree operations to IndexedDB.
 * Uses existing localDb.ts functionality for browser storage.
 */
export class IndexedDBPersistenceLayer implements PersistenceLayer {
  readonly supportsIncomingSync = false; // One-way persistence only
  readonly id: string;
  readonly type = 'local' as const;
  
  private _connected = false;

  constructor(private spaceId: string) {
    this.id = `indexeddb-${spaceId}`;
  }

  async connect(): Promise<void> {
    if (this._connected) return;
    
    // IndexedDB connection is handled automatically by Dexie
    // No explicit connection needed
    this._connected = true;
  }

  async disconnect(): Promise<void> {
    if (!this._connected) return;
    
    // IndexedDB doesn't need explicit disconnection
    this._connected = false;
  }

  async loadSpaceTreeOps(): Promise<VertexOperation[]> {
    if (!this._connected) {
      throw new Error('IndexedDBPersistenceLayer not connected');
    }
    
    // Load operations for the main space tree (treeId = spaceId)
    return await getTreeOps(this.spaceId, this.spaceId);
  }

  async saveTreeOps(treeId: string, ops: ReadonlyArray<VertexOperation>): Promise<void> {
    if (!this._connected) {
      throw new Error('IndexedDBPersistenceLayer not connected');
    }
    
    if (ops.length === 0) return;
    
    // Save operations to IndexedDB
    await appendTreeOps(this.spaceId, treeId, ops);
  }

  createTreeLoader(): (treeId: string) => Promise<VertexOperation[]> {
    return async (treeId: string) => {
      if (!this._connected) {
        throw new Error('IndexedDBPersistenceLayer not connected');
      }
      
      // Load operations for the specified app tree
      return await getTreeOps(this.spaceId, treeId);
    };
  }

  async loadSecrets(): Promise<Record<string, string> | undefined> {
    if (!this._connected) {
      throw new Error('IndexedDBPersistenceLayer not connected');
    }
    
    // Load secrets from IndexedDB
    return await getAllSecrets(this.spaceId);
  }

  async saveSecrets(secrets: Record<string, string>): Promise<void> {
    if (!this._connected) {
      throw new Error('IndexedDBPersistenceLayer not connected');
    }
    
    if (Object.keys(secrets).length === 0) return;
    
    // Save secrets to IndexedDB
    await saveAllSecrets(this.spaceId, secrets);
  }

  // No startListening/stopListening methods - one-way persistence only
} 