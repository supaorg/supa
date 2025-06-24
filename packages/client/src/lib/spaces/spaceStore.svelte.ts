import type Space from "@core/spaces/Space";
import { loadSpaceFromPointer, type SpaceConnection } from "./SpaceConnection";
import type { SpacePointer } from "./SpacePointer";
import { deleteSpace, getDraft, saveDraft, deleteDraft, getAllSecrets, saveAllSecrets, getSecret, setSecret, getPointersForUser, associateSpacesWithUser, updateSpaceUserId, associateLocalSpaceWithUser, makeSpaceLocal } from "$lib/localDb";
import { untrack } from "svelte";
import { authStore } from "$lib/stores/auth.svelte";

class SpaceStore {
  pointers: SpacePointer[] = $state([]);
  currentSpaceId: string | null = $state(null);
  connections: SpaceConnection[] = $state([]);
  config: Record<string, unknown> = $state({});
  setupModelProviders: boolean = $state(false);

  currentSpace = $derived(this.connections.find(conn => conn.space.getId() === this.currentSpaceId)?.space || null);
  currentSpaceConnection = $derived(this.connections.find(conn => conn.space.getId() === this.currentSpaceId) || null);
  currentPointer = $derived(this.pointers.find(p => p.id === this.currentSpaceId) || null);

  effectd = $effect.root(() => {
    $effect(() => {
      let providersObserver: (() => void) | null = null;

      const currentSpace = spaceStore.currentSpace;

      untrack(() => {
        if (currentSpace) {
          const providersVertex = currentSpace.tree.getVertexByPath("providers");
          if (providersVertex) {
            spaceStore.setupModelProviders = providersVertex.children.length > 0;
            providersObserver = providersVertex.observeChildren((children) => {
              spaceStore.setupModelProviders = children.length > 0;
            });
          } else {
            spaceStore.setupModelProviders = false;
          }
        } else {
          spaceStore.setupModelProviders = false;
        }
      });

      return () => {
        if (providersObserver) {
          providersObserver();
        }
      };
    });
  });

  /**
   * Initialize with data loaded from elsewhere
   * @param data The data to initialize the state with
   */
  setInitialState(data: {
    pointers: SpacePointer[],
    currentSpaceId: string | null,
    config: Record<string, unknown>
  }) {
    this.pointers = data.pointers;
    this.currentSpaceId = data.currentSpaceId;
    this.config = data.config;
  }

  /**
   * Create space connections from pointers and return the current one.
   * Use it only once on startup.
   * @returns The current space connection or null if none.
   */
  async loadSpacesAndConnectToCurrent(): Promise<SpaceConnection | null> {
    if (this.connections.length > 0) {
      // Find if any of the existing connections are connected
      const connectedConnection = this.connections.find(conn => conn.connected);
      if (connectedConnection) {
        console.error("Spaces already loaded. Can do it only once. Returning the connected one.");
        return connectedConnection;
      }
    }

    const connections: SpaceConnection[] = [];
    let currentConnection: SpaceConnection | null = null;

    // Try loading spaces from pointers
    for (const pointer of this.pointers) {
      try {
        const connection = await loadSpaceFromPointer(pointer);
        connections.push(connection);

        if (connection.space.getId() === this.currentSpaceId) {
          currentConnection = connection;
        }

        pointer.name = connection.space.name || null;
      } catch (error) {
        console.error("Could not load space", pointer, error);
      }
    }

    // If we couldn't connect to the current space in the previous loop, 
    // use the first one as the current space.
    if (!currentConnection && connections.length > 0) {
      currentConnection = connections[0];
      this.currentSpaceId = currentConnection.space.getId();
    }

    this.connections = connections;

    return currentConnection;
  }

  /**
   * Add a local space to the stores
   */
  addSpaceConnection(connection: SpaceConnection, path: string): void {
    this.connections = [...this.connections, connection];

    const pointer: SpacePointer = {
      id: connection.space.getId(),
      uri: path,
      name: connection.space.name || null,
      createdAt: connection.space.createdAt,
      userId: authStore.user?.id || null,
    };

    this.pointers = [...this.pointers, pointer];
  }

  /**
   * Get a loaded space from a pointer
   */
  getLoadedSpaceFromPointer(pointer: SpacePointer): Space | null {
    const connection = this.connections.find((conn) => conn.space.getId() === pointer.id);
    return connection ? connection.space : null;
  }

  /**
   * Get a draft for the current space
   */
  async getDraft(draftId: string): Promise<string | undefined> {
    if (!this.currentSpaceId) return undefined;
    return getDraft(this.currentSpaceId, draftId);
  }

  /**
   * Save a draft for the current space
   */
  async saveDraft(draftId: string, content: string): Promise<void> {
    if (!this.currentSpaceId) return;
    await saveDraft(this.currentSpaceId, draftId, content);
  }

  /**
   * Delete a draft for the current space
   */
  async deleteDraft(draftId: string): Promise<void> {
    if (!this.currentSpaceId) return;
    await deleteDraft(this.currentSpaceId, draftId);
  }

  /**
   * Get all secrets for the current space
   */
  async getAllSecrets(): Promise<Record<string, string> | undefined> {
    if (!this.currentSpaceId) return undefined;
    return getAllSecrets(this.currentSpaceId);
  }

  /**
   * Save all secrets for the current space
   */
  async saveAllSecrets(secrets: Record<string, string>): Promise<void> {
    if (!this.currentSpaceId) return;
    await saveAllSecrets(this.currentSpaceId, secrets);
  }

  /**
   * Get a specific secret for the current space
   */
  async getSecret(key: string): Promise<string | undefined> {
    if (!this.currentSpaceId) return undefined;
    return getSecret(this.currentSpaceId, key);
  }

  /**
   * Set a specific secret for the current space
   */
  async setSecret(key: string, value: string): Promise<void> {
    if (!this.currentSpaceId) return;
    await setSecret(this.currentSpaceId, key, value);
  }

  /**
   * Remove a space
   */
  async removeSpace(pointerId: string): Promise<void> {
    // Get the connection so we can disconnect it
    const connection = this.connections.find(conn => conn.space.getId() === pointerId);

    // Disconnect the space first if it exists and is connected
    if (connection && connection.connected) {
      await connection.disconnect();
    }

    // Remove from pointers
    this.pointers = this.pointers.filter(p => p.id !== pointerId);

    // Remove from loaded space connections
    this.connections = this.connections.filter(conn => conn.space.getId() !== pointerId);

    // If this was the current space, try to select another one
    if (this.currentSpaceId === pointerId) {
      const nextPointer = this.pointers[0];
      this.currentSpaceId = nextPointer?.id || null;
    }

    // Delete the space from the database
    await deleteSpace(pointerId);
  }

  /**
   * Disconnects all active space connections.
   * Call this when the application is closing/unmounting.
   */
  async disconnectAllSpaces(): Promise<void> {
    const disconnectPromises: Promise<void>[] = [];

    for (const connection of this.connections) {
      if (connection.connected) {
        disconnectPromises.push(connection.disconnect());
      }
    }

    await Promise.all(disconnectPromises);
  }

  /**
   * Get a space connection by space ID.
   */
  getSpaceConnectionById(spaceId: string): SpaceConnection | null {
    return this.connections.find(conn => conn.space.getId() === spaceId) || null;
  }

  /**
   * Filter spaces for the current user
   */
  async filterSpacesForCurrentUser(): Promise<void> {
    const userId = authStore.user?.id || null;
    const userPointers = await getPointersForUser(userId);
    
    // Update pointers to only show user's spaces
    this.pointers = userPointers;
    
    // If current space is not visible to user, clear it
    const currentSpaceVisible = userPointers.find(p => p.id === this.currentSpaceId);
    if (!currentSpaceVisible) {
      this.currentSpaceId = userPointers.length > 0 ? userPointers[0].id : null;
    }
    
    // Filter connections to match visible pointers
    const visibleSpaceIds = new Set(userPointers.map(p => p.id));
    this.connections = this.connections.filter(conn => visibleSpaceIds.has(conn.space.getId()));
  }

  /**
   * Handle user sign in - filter spaces but keep local spaces accessible
   */
  async handleUserSignIn(userId: string): Promise<void> {
    // Don't automatically associate existing spaces with the user
    // Just filter spaces to show user's spaces + local spaces
    await this.filterSpacesForCurrentUser();
  }

  /**
   * Handle user sign out - show only anonymous spaces
   */
  async handleUserSignOut(): Promise<void> {
    // Filter spaces for anonymous user (null userId)
    await this.filterSpacesForCurrentUser();
  }

  /**
   * Update userId for a specific space
   */
  async updateSpaceUser(spaceId: string, userId: string | null): Promise<void> {
    await updateSpaceUserId(spaceId, userId);
    
    // Update the pointer in memory
    const pointerIndex = this.pointers.findIndex(p => p.id === spaceId);
    if (pointerIndex !== -1) {
      this.pointers[pointerIndex] = { ...this.pointers[pointerIndex], userId };
    }
  }

  /**
   * Associate a local space with the current user
   */
  async associateSpaceWithCurrentUser(spaceId: string): Promise<void> {
    if (!authStore.user) {
      throw new Error('No user is currently signed in');
    }
    
    await associateLocalSpaceWithUser(spaceId, authStore.user.id);
    
    // Update the pointer in memory
    const pointerIndex = this.pointers.findIndex(p => p.id === spaceId);
    if (pointerIndex !== -1) {
      this.pointers[pointerIndex] = { ...this.pointers[pointerIndex], userId: authStore.user.id };
    }
  }

  /**
   * Make a space local (remove user association)
   */
  async makeSpaceLocal(spaceId: string): Promise<void> {
    await makeSpaceLocal(spaceId);
    
    // Update the pointer in memory
    const pointerIndex = this.pointers.findIndex(p => p.id === spaceId);
    if (pointerIndex !== -1) {
      this.pointers[pointerIndex] = { ...this.pointers[pointerIndex], userId: null };
    }
  }

  /**
   * Check if a space is local (has no user association)
   */
  isSpaceLocal(spaceId: string): boolean {
    const pointer = this.pointers.find(p => p.id === spaceId);
    return pointer?.userId === null;
  }

  /**
   * Check if current user owns a space
   */
  doesCurrentUserOwnSpace(spaceId: string): boolean {
    if (!authStore.user) return false;
    const pointer = this.pointers.find(p => p.id === spaceId);
    return pointer?.userId === authStore.user.id;
  }
}

export const spaceStore = new SpaceStore();