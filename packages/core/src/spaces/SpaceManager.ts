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

    // Start connecting all layers in parallel and load ops
    const layerPromises = persistenceLayers.map(async (layer) => {
      await layer.connect();
      const ops = await layer.loadSpaceTreeOps();
      return { layer, ops };
    });

    let space: Space;

    try {
      // Use the first layer that successfully loads
      // One layer is enough to construct the space
      const firstResult = await Promise.race(layerPromises);

      space = new Space(new RepTree(uuid(), firstResult.ops));

      // Continue with remaining layers as they complete
      Promise.allSettled(layerPromises).then(results => {
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value !== firstResult) {
            const { ops } = result.value;
            if (ops.length > 0) {
              space.tree.merge(ops);
            }
          }
        });

        // @TODO: consider to sync the layers with each other here
      }).catch(error => console.error('Failed to load from additional layers:', error));
    } catch (error) {
      console.error('Failed to load space tree from any layer:', error);
      console.log('As a fallback, will try to load from all layers');

      // Fallback: gather all ops from all layers that managed to load
      const allOps: VertexOperation[] = [];
      const results = await Promise.allSettled(layerPromises);

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          allOps.push(...result.value.ops);
        }
      });

      // Create space with all available ops (RepTree handles deduplication)
      space = new Space(new RepTree(uuid(), allOps));
    }

    // Register tree loader that uses race-based loading
    space.registerTreeLoader(async (appTreeId: string) => {
      const treeLoadPromises = persistenceLayers.map(async (layer) => {
        const ops = await layer.loadTreeOps(appTreeId);
        return { layer, ops };
      });

      try {
        // Use the first layer that successfully loads the app tree
        const firstTreeResult = await Promise.race(treeLoadPromises);
        if (firstTreeResult.ops.length === 0) {
          throw new Error("No app tree ops found");
        }

        const tree = new RepTree(uuid(), firstTreeResult.ops);
        // @NOTE: would make sense to check if the tree has a valid structure for an app tree
        if (!tree.root) {
          throw new Error("No root vertex found in app tree");
        }

        const appTree = new AppTree(tree);

        // Continue with remaining layers as they complete
        Promise.allSettled(treeLoadPromises).then(results => {
          results.forEach(result => {
            if (result.status === 'fulfilled' && result.value !== firstTreeResult) {
              const { ops } = result.value;
              if (ops.length > 0) {
                appTree.tree.merge(ops);
              }
            }
          });
        }).catch(error => console.error('Failed to load app tree from additional layers:', error));

        return appTree;
      } catch {
        // Try to get ops from all layers
        const allOps: VertexOperation[] = [];
        const results = await Promise.allSettled(treeLoadPromises);

        results.forEach(result => {
          if (result.status === 'fulfilled') {
            allOps.push(...result.value.ops);
          }
        });

        const tree = new RepTree(uuid(), allOps);
        if (!tree.root) {
          return undefined;
        }

        const appTree = new AppTree(tree);
        return appTree;
      }
    });

    // Load secrets using race-based approach
    const secretPromises = persistenceLayers.map(async (layer) => {
      const secrets = await layer.loadSecrets();
      return { layer, secrets };
    });

    try {
      // Use the first layer that successfully loads secrets
      const firstSecretsResult = await Promise.race(secretPromises);
      if (firstSecretsResult.secrets && Object.keys(firstSecretsResult.secrets).length > 0) {
        space.saveAllSecrets(firstSecretsResult.secrets);
      }

      // Continue with remaining layers as they complete
      Promise.allSettled(secretPromises).then(results => {
        const additionalSecrets: Record<string, string> = {};
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value !== firstSecretsResult) {
            const { secrets } = result.value;
            if (secrets) {
              Object.assign(additionalSecrets, secrets);
            }
          }
        });
        if (Object.keys(additionalSecrets).length > 0) {
          space.saveAllSecrets(additionalSecrets);
        }
      }).catch(error => console.error('Failed to load secrets from additional layers:', error));
    } catch (error) {
      console.error('Failed to load secrets from any layer:', error);
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
   * Sync tree operations between layers. It means that layers will share missing ops between each other.
   * We need it to make sure that all layers converge to the same latest state in case if they were not saving ops at the same time.
   * @param spaceId - The id of the space
   * @param treeId - The id of the tree to sync
   * @param layers - The layers to sync the tree between
   */
  syncTreeOpsBetweenLayers(spaceId: string, treeId: string, layers: PersistenceLayer[]) {
    const space = this.spaces.get(spaceId);
    if (!space) {
      throw new Error("Space not found");
    }

    // Get ops for the tree from all layers and merge them between each other

    // Create a tree for each layer, get ops missing from each other and save the missing ops to layers

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