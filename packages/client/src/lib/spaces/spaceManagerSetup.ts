import { SpaceManager } from "@core/spaces/SpaceManager";
import type { SpacePointer } from "@core/spaces/SpaceManager";
import type { SpaceConnection } from "./SpaceConnection";
import type Space from "@core/spaces/Space";
import { IndexedDBPersistenceLayer } from "./persistence/IndexedDBPersistenceLayer";

/**
 * Global space manager instance for the client
 */
export const spaceManager = new SpaceManager();

/**
 * Wrapper that adapts SpaceManager-managed spaces to the SpaceConnection interface
 */
class ManagedSpaceConnection implements SpaceConnection {
  private _space: Space;
  private _connected: boolean = false;

  constructor(space: Space) {
    this._space = space;
    this._connected = true; // Space is already connected through SpaceManager
  }

  get space(): Space {
    return this._space;
  }

  get connected(): boolean {
    return this._connected;
  }

  async connect(): Promise<void> {
    // Already connected through SpaceManager
    this._connected = true;
  }

  async disconnect(): Promise<void> {
    // Disconnect through SpaceManager
    await spaceManager.closeSpace(this._space.getId());
    this._connected = false;
  }
}

/**
 * Create a new local space using SpaceManager with IndexedDB persistence
 */
export async function createNewLocalSpace(): Promise<SpaceConnection> {
  // Create space without persistence first to get the ID
  const space = await spaceManager.createSpace();
  const spaceId = space.getId();
  
  // Create IndexedDB layer with the actual space ID
  const indexedDBLayer = new IndexedDBPersistenceLayer(spaceId);
  await indexedDBLayer.connect();
  
  // Save the initial space operations to IndexedDB
  const initialOps = space.tree.getAllOps();
  await indexedDBLayer.saveTreeOps(spaceId, initialOps);
  
  // Add the persistence layer to the space for future operations
  spaceManager.addPersistenceLayer(spaceId, indexedDBLayer);
  
  return new ManagedSpaceConnection(space);
}

/**
 * Load an existing local space using SpaceManager with IndexedDB persistence
 */
export async function loadExistingLocalSpace(pointer: SpacePointer): Promise<SpaceConnection> {
  const indexedDBLayer = new IndexedDBPersistenceLayer(pointer.id);
  
  const space = await spaceManager.loadSpace(pointer, [indexedDBLayer]);
  
  return new ManagedSpaceConnection(space);
}

/**
 * Helper to check if a URI represents a local space
 */
export function isLocalSpaceUri(uri: string): boolean {
  return uri.startsWith('browser://');
} 