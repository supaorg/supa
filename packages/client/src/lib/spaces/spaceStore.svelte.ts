import type Space from "@core/spaces/Space";
import type { SpacePointer } from "./SpacePointer";
import { deleteSpace, getDraft, saveDraft, deleteDraft, getAllSecrets, saveAllSecrets, getSecret, setSecret, getPointersForUser, associateSpacesWithUser, updateSpaceUserId, associateLocalSpaceWithUser, makeSpaceLocal } from "$lib/localDb";
import { untrack } from "svelte";
import { authStore } from "$lib/stores/auth.svelte";
import { spaceManager } from "./spaceManagerSetup";
import { loadExistingLocalSpace } from "./spaceManagerSetup";

class SpaceStore {
  pointers: SpacePointer[] = $state([]);
  currentSpaceId: string | null = $state(null);
  config: Record<string, unknown> = $state({});
  setupModelProviders: boolean = $state(false);

  // Lazy loading of current space through SpaceManager
  currentSpace: Space | null = $derived.by(() => {
    if (!this.currentSpaceId) return null;
    
    const pointer = this.pointers.find(p => p.id === this.currentSpaceId);
    if (!pointer) return null;

    // Try to get from SpaceManager first
    let space = spaceManager.getSpace(this.currentSpaceId);
    
    // If not loaded, load it lazily
    if (!space && pointer.uri.startsWith("local://")) {
      // Load local space asynchronously - this is a bit tricky with $derived
      // For now, return null and trigger loading in an effect
      Promise.resolve().then(async () => {
        try {
          await loadExistingLocalSpace(pointer);
        } catch (error) {
          console.error("Failed to load space", pointer, error);
        }
      });
      return null;
    }

    return space || null;
  });

  currentPointer = $derived(this.pointers.find(p => p.id === this.currentSpaceId) || null);

  effectd = $effect.root(() => {
    $effect(() => {
      let providersObserver: (() => void) | null = null;

      const currentSpace = this.currentSpace;

      untrack(() => {
        if (currentSpace) {
          const providersVertex = currentSpace.tree.getVertexByPath("providers");
          if (providersVertex) {
            this.setupModelProviders = providersVertex.children.length > 0;
            providersObserver = providersVertex.observeChildren((children) => {
              this.setupModelProviders = children.length > 0;
            });
          } else {
            this.setupModelProviders = false;
          }
        } else {
          this.setupModelProviders = false;
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
   * Load a specific space by pointer if not already loaded
   * @param pointer The space pointer to load
   * @returns The loaded space or null if failed
   */
  async loadSpace(pointer: SpacePointer): Promise<Space | null> {
    // Check if already loaded
    let space = spaceManager.getSpace(pointer.id);
    if (space) return space;

    // Load the space based on its URI
    if (pointer.uri.startsWith("local://")) {
      try {
        const connection = await loadExistingLocalSpace(pointer);
        return connection.space;
      } catch (error) {
        console.error("Failed to load space", pointer, error);
        return null;
      }
    }

    // For non-local spaces, we'll need to implement loading logic
    // For now, return null
    console.warn("Loading non-local spaces not yet implemented");
    return null;
  }

  /**
   * Ensure current space is loaded and return it
   * @returns The current space or null if none selected or failed to load
   */
  async ensureCurrentSpaceLoaded(): Promise<Space | null> {
    if (!this.currentSpaceId) return null;
    
    const pointer = this.pointers.find(p => p.id === this.currentSpaceId);
    if (!pointer) return null;

    return await this.loadSpace(pointer);
  }

  /**
   * Add a space pointer to the store
   * @param pointer The space pointer to add
   */
  addSpacePointer(pointer: SpacePointer): void {
    this.pointers = [...this.pointers, pointer];
  }

  /**
   * Get a loaded space by ID
   * @param spaceId The space ID
   * @returns The space if loaded, null otherwise
   */
  getLoadedSpace(spaceId: string): Space | null {
    return spaceManager.getSpace(spaceId) || null;
  }

  /**
   * Get a loaded space from a pointer
   */
  getLoadedSpaceFromPointer(pointer: SpacePointer): Space | null {
    return this.getLoadedSpace(pointer.id);
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
    // Close space in SpaceManager if loaded
    const space = spaceManager.getSpace(pointerId);
    if (space) {
      await spaceManager.closeSpace(pointerId);
    }

    // Remove from pointers
    this.pointers = this.pointers.filter(p => p.id !== pointerId);

    // If this was the current space, try to select another one
    if (this.currentSpaceId === pointerId) {
      const nextPointer = this.pointers[0];
      this.currentSpaceId = nextPointer?.id || null;
    }

    // Delete the space from the database
    await deleteSpace(pointerId);
  }

  /**
   * Disconnects all active spaces.
   * Call this when the application is closing/unmounting.
   */
  async disconnectAllSpaces(): Promise<void> {
    // SpaceManager handles cleanup internally
    // No need to manually disconnect individual spaces
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