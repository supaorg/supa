import { RepTree } from "reptree";
import type { VertexOperation } from "reptree";
import Space from "./Space";
import AppTree from "./AppTree";
import type { PersistenceLayer } from "./persistence/PersistenceLayer";
import uuid from "../uuid/uuid";

export interface SpacePointer {
  id: string;
  uri: string;
  name: string | null;
  createdAt: Date;
  userId: string | null;
}

export interface SpaceConfig {
  persistenceLayers?: PersistenceLayer[];
}

/**
 * Manages spaces and their persistence layers.
 * Handles loading, saving, and orchestrating multiple persistence strategies.
 */
export class SpaceManager {
  private spaces = new Map<string, Space>();
  private spaceLayers = new Map<string, PersistenceLayer[]>();

  /**
   * Create a new space with the given persistence layers
   */
  async createSpace(config?: SpaceConfig): Promise<Space> {
    const persistenceLayers = config?.persistenceLayers || [];
    const space = Space.newSpace(uuid());
    const spaceId = space.getId();
    
    if (persistenceLayers.length > 0) {
      // Connect all layers
      await Promise.all(persistenceLayers.map(layer => layer.connect()));
      
      // Save initial operations to all layers
      const initOps = space.tree.getAllOps();
      await Promise.all(
        persistenceLayers.map(layer => layer.saveTreeOps(spaceId, initOps))
      );
      
      // Set up operation tracking and sync
      this.setupOperationTracking(space, persistenceLayers);
      await this.setupTwoWaySync(space, persistenceLayers);
      
      this.spaceLayers.set(spaceId, persistenceLayers);
    }
    
    this.spaces.set(spaceId, space);
    return space;
  }

  /**
   * Load an existing space from persistence layers
   */
  async loadSpace(pointer: SpacePointer, persistenceLayers: PersistenceLayer[]): Promise<Space> {
    const spaceId = pointer.id;
    
    // Check if already loaded
    const existingSpace = this.spaces.get(spaceId);
    if (existingSpace) {
      return existingSpace;
    }
    
    // Connect all layers
    await Promise.all(persistenceLayers.map(layer => layer.connect()));
    
    // Load operations from all layers and merge
    const allOps: VertexOperation[] = [];
    for (const layer of persistenceLayers) {
      const ops = await layer.loadSpaceTreeOps();
      allOps.push(...ops);
    }
    
    // RepTree handles deduplication and conflict resolution
    const space = new Space(new RepTree(uuid(), allOps));
    
    // Register tree loader that tries all layers
    space.registerTreeLoader(async (appTreeId: string) => {
      const allTreeOps: VertexOperation[] = [];
      for (const layer of persistenceLayers) {
        const loader = layer.createTreeLoader();
        const ops = await loader(appTreeId);
        allTreeOps.push(...ops);
      }
      if (allTreeOps.length === 0) return undefined;
      return new AppTree(new RepTree(uuid(), allTreeOps));
    });
    
    // Load secrets from all layers and merge  
    const allSecrets: Record<string, string> = {};
    for (const layer of persistenceLayers) {
      const secrets = await layer.loadSecrets();
      if (secrets) {
        Object.assign(allSecrets, secrets);
      }
    }
    if (Object.keys(allSecrets).length > 0) {
      space.saveAllSecrets(allSecrets);
    }
    
    // Set up operation tracking to save to all layers
    this.setupOperationTracking(space, persistenceLayers);
    
    // Set up two-way sync for layers that support it
    await this.setupTwoWaySync(space, persistenceLayers);
    
    this.spaceLayers.set(spaceId, persistenceLayers);
    this.spaces.set(spaceId, space);
    
    return space;
  }

  /**
   * Close a space and disconnect its persistence layers
   */
  async closeSpace(spaceId: string): Promise<void> {
    const layers = this.spaceLayers.get(spaceId);
    if (layers) {
      // Stop listening on two-way sync layers
      await Promise.all(
        layers
          .filter(layer => layer.supportsIncomingSync && layer.stopListening)
          .map(layer => layer.stopListening!())
      );
      
      // Disconnect all layers
      await Promise.all(layers.map(layer => layer.disconnect()));
      
      this.spaceLayers.delete(spaceId);
    }
    
    this.spaces.delete(spaceId);
  }

  /**
   * Get all active spaces
   */
  getActiveSpaces(): Space[] {
    return Array.from(this.spaces.values());
  }

  /**
   * Get a specific space by ID
   */
  getSpace(spaceId: string): Space | undefined {
    return this.spaces.get(spaceId);
  }

  /**
   * Add a persistence layer to an existing space
   */
  addPersistenceLayer(spaceId: string, layer: PersistenceLayer): void {
    const existingLayers = this.spaceLayers.get(spaceId) || [];
    const space = this.spaces.get(spaceId);
    
    if (space) {
      const newLayers = [...existingLayers, layer];
      this.spaceLayers.set(spaceId, newLayers);
      
      // Set up tracking for the new layer
      this.setupOperationTrackingForLayer(space, layer);
    }
  }

  /**
   * Remove a persistence layer from a space
   */
  removePersistenceLayer(spaceId: string, layerId: string): void {
    const layers = this.spaceLayers.get(spaceId);
    if (layers) {
      const updatedLayers = layers.filter(layer => layer.id !== layerId);
      this.spaceLayers.set(spaceId, updatedLayers);
      
      // Disconnect the removed layer
      const removedLayer = layers.find(layer => layer.id === layerId);
      if (removedLayer) {
        removedLayer.disconnect().catch(console.error);
      }
    }
  }

  private setupOperationTracking(space: Space, layers: PersistenceLayer[]) {
    // Track main space tree ops
    space.tree.observeOpApplied((op) => {
      if (op.id.peerId === space.tree.peerId && !('transient' in op && op.transient)) {
        // Save to all layers in parallel
        Promise.all(layers.map(layer => layer.saveTreeOps(space.getId(), [op])))
          .catch(error => console.error('Failed to save space tree operation:', error));
      }
    });
    
    // Track new AppTree creation
    space.observeNewAppTree((appTreeId) => {
      const appTree = space.getAppTree(appTreeId)!;
      const ops = appTree.tree.getAllOps();
      
      // Save initial ops to all layers
      Promise.all(layers.map(layer => layer.saveTreeOps(appTreeId, ops)))
        .catch(error => console.error('Failed to save new app tree ops:', error));
      
      // Track future ops on this AppTree
      appTree.tree.observeOpApplied((op) => {
        if (op.id.peerId === appTree.tree.peerId && !('transient' in op && op.transient)) {
          Promise.all(layers.map(layer => layer.saveTreeOps(appTreeId, [op])))
            .catch(error => console.error('Failed to save app tree operation:', error));
        }
      });
    });
    
    // Track loaded AppTree operations
    space.observeTreeLoad((appTreeId) => {
      const appTree = space.getAppTree(appTreeId)!;
      appTree.tree.observeOpApplied((op) => {
        if (op.id.peerId === appTree.tree.peerId && !('transient' in op && op.transient)) {
          Promise.all(layers.map(layer => layer.saveTreeOps(appTreeId, [op])))
            .catch(error => console.error('Failed to save loaded app tree operation:', error));
        }
      });
    });
    
    // Track secrets changes
    this.wrapSecretsMethod(space, layers);
  }

  private setupOperationTrackingForLayer(space: Space, layer: PersistenceLayer) {
    // This is a simplified version for adding a single layer
    // In a full implementation, we'd need to avoid duplicate tracking
    this.setupOperationTracking(space, [layer]);
  }

  private async setupTwoWaySync(space: Space, layers: PersistenceLayer[]) {
    const spaceId = space.getId();
    
    for (const layer of layers) {
      if (layer.supportsIncomingSync && layer.startListening) {
        await layer.startListening((treeId, incomingOps) => {
          // Apply incoming operations to the appropriate tree
          if (treeId === spaceId) {
            space.tree.merge(incomingOps);
          } else {
            const appTree = space.getAppTree(treeId);
            if (appTree) {
              appTree.tree.merge(incomingOps);
            }
          }
        });
      }
    }
  }

  private wrapSecretsMethod(space: Space, layers: PersistenceLayer[]) {
    const originalSetSecret = space.setSecret.bind(space);
    const originalSaveAllSecrets = space.saveAllSecrets.bind(space);

    space.setSecret = (key: string, value: string) => {
      originalSetSecret(key, value);
      // Save to all layers in parallel
      Promise.all(layers.map(layer => layer.saveSecrets({ [key]: value })))
        .catch(error => console.error('Failed to save secret:', error));
    };

    space.saveAllSecrets = (secrets: Record<string, string>) => {
      originalSaveAllSecrets(secrets);
      // Save to all layers in parallel
      Promise.all(layers.map(layer => layer.saveSecrets(secrets)))
        .catch(error => console.error('Failed to save secrets:', error));
    };
  }
} 