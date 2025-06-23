import Space from "@core/spaces/Space";
import type { SpaceConnection } from "./SpaceConnection";
import uuid from "@core/uuid/uuid";
import { Backend } from "@core/spaces/Backend";
import { getTreeOps } from "$lib/localDb";
import type { VertexOperation } from "@core";
import { RepTree, isAnyPropertyOp, isMoveVertexOp } from "@core";
import AppTree from "@core/spaces/AppTree";
import SpacePersistenceQueue from "./SpacePersistenceQueue";
import type { SpacePointer } from "./SpacePointer";
import { getSpaceTreeOps } from "$lib/utils/api";

export class InBrowserSpaceSync implements SpaceConnection {
  private _space: Space;
  private _connected: boolean = false;
  private _backend: Backend | undefined;
  private thingsToSave: SpacePersistenceQueue;

  constructor(space: Space, uri?: string) {
    this._space = space;
    this.thingsToSave = new SpacePersistenceQueue(space.getId());

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
        let ops = await getTreeOps(spaceId, appTreeId);

        if (ops.length === 0) {
          // Try to load from the server
          console.log(`No local operations found for tree ${appTreeId}, trying to load from server`);
          ops = await getSpaceTreeOps(spaceId, appTreeId);
          
          if (ops.length === 0) {
            return undefined;
          }
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

    // Set up continuous frame loop to save data
    this.startSaveLoop();
  }

  private wrapSecretsMethod() {
    const originalSetSecret = this._space.setSecret.bind(this._space);
    const originalSaveAllSecrets = this._space.saveAllSecrets.bind(this._space);

    this._space.setSecret = (key: string, value: string) => {
      originalSetSecret(key, value);
      this.thingsToSave.addSecret(key, value);
    };

    this._space.saveAllSecrets = (secrets: Record<string, string>) => {
      originalSaveAllSecrets(secrets);
      Object.keys(secrets).forEach(key => {
        this.thingsToSave.addSecret(key, secrets[key]);
      });
    };
  }

  /**
   * Start the continuous save loop that runs at the end of each frame
   */
  private startSaveLoop() {
    const saveLoop = () => {
      this.thingsToSave.saveAll();
      requestAnimationFrame(saveLoop);
    };
    requestAnimationFrame(saveLoop);
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
    await this.thingsToSave.saveAll();

    this._connected = false;
  }

  private async loadSecrets() {
    try {
      const secrets = await this.thingsToSave.getSavedSecrets();
      if (secrets) {
        this._space.saveAllSecrets(secrets);
      }
    } catch (error) {
      console.error("Error loading secrets", error);
    }
  }

  addOpsToSave(treeId: string, ops: ReadonlyArray<VertexOperation>) {
    this.thingsToSave.addOps(treeId, ops);
  }

  private handleOpAppliedFromSamePeer(tree: RepTree, op: VertexOperation) {
    // Important that we don't save ops from other peers here
    if (op.id.peerId !== tree.peerId) {
      return;
    }

    const treeId = tree.root!.id;

    // Only save move ops or non-transient property ops (so, no transient properties)
    if (isMoveVertexOp(op) || (isAnyPropertyOp(op) && !op.transient)) {
      this.thingsToSave.addOps(treeId, [op]);
    }
  }

  private handleNewAppTree(appTreeId: string) {
    // Add all ops from app tree into the sync
    const appTree = this._space.getAppTree(appTreeId);

    if (!appTree) {
      console.error("App tree not found", appTreeId);
      return;
    }

    const ops = appTree.tree.getAllOps();
    this.thingsToSave.addOps(appTreeId, ops);

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

export async function createNewInBrowserSpaceSyncWithOps(ops: ReadonlyArray<VertexOperation>, uri?: string): Promise<SpaceConnection> {
  const space = Space.existingSpaceFromOps(ops);
  const sync = new InBrowserSpaceSync(space, uri);

  sync.addOpsToSave(space.getId(), ops);
  
  await sync.connect();
  return sync;
}

export async function loadExistingInBrowserSpaceSync(pointer: SpacePointer): Promise<SpaceConnection> {
  const spaceId = pointer.id;
  const uri = pointer.uri;
  
  try {
    // Load operations for the main space tree
    const spaceOps = await getTreeOps(spaceId, spaceId);

    if (spaceOps.length === 0) {
      // No operations found - this might be a new space, create it
      throw new Error(`No operations found for space ${spaceId}`);
    }

    // Create the space from operations
    const space = new Space(new RepTree(uuid(), spaceOps));

    const sync = new InBrowserSpaceSync(space, uri);
    await sync.connect();
    return sync;
  } catch (error) {
    console.error(`Failed to load space ${spaceId} from database:`, error);
    throw error;
  }
}