import { AuthStore, type User } from './auth.svelte';
import { ThemeStore } from './theme.svelte';
import { SpaceState } from './spaceState.svelte';
import { isDevMode, spaceInspectorOpen } from './devMode';
import { txtStore } from './txtStore';
import { setupSwins } from './swinsLayout';
import type { SpacePointer } from "../spaces/SpacePointer";
import { createPersistenceLayersForURI } from "../spaces/persistence/persistenceUtils";
import { loadSpaceMetadataFromPath } from "../spaces/fileSystemSpaceUtils";
import { initializeDatabase, savePointers, saveConfig, deleteSpace, saveCurrentSpaceId } from "$lib/localDb";
import { SpaceManager } from "@core/spaces/SpaceManager";
import type Space from '@core/spaces/Space';

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

type InitializationStatus = "initializing" | "needsSpace" | "ready" | "error";
type SpaceStatus = "disconnected" | "loading" | "ready" | "error";

/**
 * Central orchestration hub for client-side state management.
 * Coordinates multiple focused stores and provides unified workflows.
 */
export class ClientState {

  private _initializationStatus: InitializationStatus = $state("initializing");
  private _initializationError: string | null = $state(null);
  private _spaceManager = new SpaceManager();
  private _defaultTheme: ThemeStore = $state(new ThemeStore());

  spaceStates: SpaceState[] = $state([]);
  currentSpaceState: SpaceState | null = $state(null);
  currentSpace: Space | null = $derived(this.currentSpaceState?.space || null);

  // Space data
  pointers: SpacePointer[] = $state([]);
  currentSpaceId: string | null = $derived(this.currentSpaceState?.pointer.id || null);
  config: Record<string, unknown> = $state({});

  auth = new AuthStore();

  spaceStatus: SpaceStatus = $derived.by(() => {
    if (!this.currentSpaceState) {
      return "disconnected";
    }

    if (!this.currentSpaceState.isConnected) {
      return "loading";
    }

    return "ready";
  });

  // @TODO: consider to remove these and just use the status directly
  isInitializing: boolean = $derived(this._initializationStatus === "initializing");
  needsSpace: boolean = $derived(this._initializationStatus === "needsSpace");
  isReady: boolean = $derived(this._initializationStatus === "ready");
  initializationError: string | null = $derived(this._initializationError);

  theme: ThemeStore = $derived.by(() => {
    // Use current space's theme if available, otherwise global theme
    if (this.currentSpaceState) {
      return this.currentSpaceState.theme;
    } else {
      return this._defaultTheme;
    }
  });

  dev = {
    isDevMode,
    spaceInspectorOpen
  };
  texts = txtStore;

  layout = {
    swins: setupSwins(),

    openSettings: () => {
      this.layout.swins.open('settings', {}, 'Settings');
    },
    openSpaces: () => {
      this.layout.swins.open('spaces', {}, 'Spaces');
    }
  };

  /**
   * Single initialization method that handles database loading and everything
   */
  async initializeWithDatabase(): Promise<void> {
    try {
      this._initializationStatus = "initializing";
      this._initializationError = null;

      // Initialize database and load space data
      const { pointers, currentSpaceId, config } = await initializeDatabase();
      this.pointers = pointers;
      this.config = config;

      // Create SpaceState instances for all pointers
      this.spaceStates = pointers.map(pointer => new SpaceState(pointer, this._spaceManager));

      // Check authentication and filter spaces (dummy for now)
      await this.auth.checkAuth();
      if (this.auth.isAuthenticated) {
        // @TODO: implement connection to server
      }

      // Set current space and connect to it
      await this._setCurrentSpace(currentSpaceId);

      // Set final status
      this._updateInitializationStatus();

    } catch (error) {
      console.error('Failed to initialize client state:', error);
      this._initializationStatus = "error";
      this._initializationError = error instanceof Error ? error.message : String(error);
    }
  }

  /**
   * Switch to a specific space by ID
   */
  async switchToSpace(spaceId: string): Promise<void> {
    if (this.currentSpaceId === spaceId) return;

    await this._setCurrentSpace(spaceId);
    await this._saveState();
  }

  /**
   * Create a new local space using SpaceManager with URI-based persistence
   */
  async createNewLocalSpace(uri?: string): Promise<string> {
    const spaceId = crypto.randomUUID();
    
    // If no URI is provided, use the spaceId as the URI
    if (!uri) {
      uri = "local://" + spaceId;
    }

    const pointer: SpacePointer = {
      id: spaceId,
      uri: uri,
      name: null,
      createdAt: new Date(),
      userId: this.auth.user?.id || null,
    };

    // Create persistence layers based on URI
    const persistenceLayers = createPersistenceLayersForURI(spaceId, pointer.uri);

    // Create space with appropriate persistence layers
    const space = await this._spaceManager.createSpace({ persistenceLayers });

    // Update pointer with space metadata
    pointer.name = space.name || null;
    pointer.createdAt = space.createdAt;

    // Add to our collections
    this.pointers = [...this.pointers, pointer];
    const newSpaceState = new SpaceState(pointer, this._spaceManager);
    this.spaceStates = [...this.spaceStates, newSpaceState];

    // Switch to the new space
    await this.switchToSpace(spaceId);

    this._updateInitializationStatus();
    await this._saveState();

    return spaceId;
  }

  /**
   * Remove a space by ID
   */
  async removeSpace(spaceId: string): Promise<void> {
    // Find and disconnect the space being removed (since we keep spaces connected now)
    const spaceToRemove = this.spaceStates.find(s => s.pointer.id === spaceId);
    if (spaceToRemove) {
      spaceToRemove.disconnect();
    }

    // Clear current space if it's being removed
    if (this.currentSpaceState?.pointer.id === spaceId) {
      this.currentSpaceState = null;
    }

    // Remove from our collections
    this.pointers = this.pointers.filter(p => p.id !== spaceId);
    this.spaceStates = this.spaceStates.filter(s => s.pointer.id !== spaceId);

    // Update current space if it was removed
    if (this.currentSpaceId === spaceId) {
      const nextSpaceId = this.pointers.length > 0 ? this.pointers[0].id : null;
      if (nextSpaceId) {
        await this.switchToSpace(nextSpaceId);
      } else {
        // currentSpaceState is already null from the disconnect above
        // currentSpaceId will be derived as null automatically
      }
    }

    // Delete from database
    await deleteSpace(spaceId);

    this._updateInitializationStatus();
    await this._saveState();
  }

  /**
   * Update space name
   */
  async updateSpaceName(spaceId: string, name: string): Promise<void> {
    // Update in pointers
    this.pointers = this.pointers.map(p =>
      p.id === spaceId ? { ...p, name } : p
    );

    // Update in SpaceState
    const spaceState = this.spaceStates.find(s => s.pointer.id === spaceId);
    if (spaceState) {
      spaceState.pointer = { ...spaceState.pointer, name };

      if (!spaceState.isConnected) {
        await spaceState.connect();
      }

      // Update loaded space if exists
      if (spaceState.space) {
        spaceState.space.name = name;
      }
    }

    await this._saveState();
  }

  // === Dummy Auth Functions (until auth is implemented) ===

  /**
   * Dummy implementation - no filtering for now
   */
  private async _filterSpacesForCurrentUser(): Promise<void> {
    // For now, do nothing - all spaces are visible
    // TODO: Implement when auth is needed
  }

  /**
   * Dummy implementation for user sign out
   */
  private async _handleUserSignOut(): Promise<void> {
    // For now, do nothing  
    // TODO: Implement when auth is needed
  }

  /**
   * Internal method to set and connect to current space
   */
  private async _setCurrentSpace(spaceId: string | null): Promise<void> {
    // Don't disconnect current space - keep it connected for fast switching
    this.currentSpaceState = null;

    if (!spaceId) return;

    // Find and connect to new space
    const spaceState = this.spaceStates.find(s => s.pointer.id === spaceId);
    if (spaceState) {
      try {
        this.currentSpaceState = spaceState;
        
        // Connect if not already connected
        if (!spaceState.isConnected) {
          await spaceState.connect();
        }
      } catch (error) {
        console.error(`Failed to connect to space ${spaceId}:`, error);
        // Don't set currentSpace if connection failed
        this.currentSpaceState = null;
      }
    }
  }

  private _updateInitializationStatus(): void {
    if (this.pointers.length === 0) {
      this._initializationStatus = "needsSpace";
    } else {
      // Ensure we have a current space selected
      if (!this.currentSpaceId && this.pointers.length > 0) {
        const defaultSpaceId = this.pointers[0].id;
        this._setCurrentSpace(defaultSpaceId);
      }
      this._initializationStatus = "ready";
    }
  }

  /**
   * Explicitly save current state to database
   */
  private async _saveState(): Promise<void> {
    try {
      await Promise.all([
        savePointers(this.pointers),
        saveConfig(this.config),
        saveCurrentSpaceId(this.currentSpaceId)
      ]);
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }

  /**
   * Orchestrated sign-in workflow (dummy for now)
   */
  async signIn(tokens: AuthTokens, user: User): Promise<void> {
    await this.auth.setAuth(tokens, user);
    // @TODO: implement connection to server
    this._updateInitializationStatus();
    await this._saveState();
  }

  /**
   * Orchestrated sign-out workflow (dummy for now)
   */
  async signOut(): Promise<void> {
    // Disconnect all spaces since we keep them connected during normal operation
    for (const spaceState of this.spaceStates) {
      spaceState.disconnect();
    }
    this.currentSpaceState = null;

    await this.auth.logout();
    await this._handleUserSignOut(); // Dummy
    this._updateInitializationStatus();
    // @TODO: implement disconnect from server
    await this._saveState();
  }

  /**
   * Create a new synced space (TODO: implement server sync)
   */
  async createNewSyncedSpace(): Promise<string> {
    // TODO: Implement server-synced space creation
    throw new Error("Synced spaces not yet implemented");
  }

  /**
   * Load an existing file system space
   */
  async loadFileSystemSpace(path: string): Promise<string> {
    // Load space metadata from the file system
    const { spaceId } = await loadSpaceMetadataFromPath(path);

    // Check if space is already loaded
    const existingPointer = this.pointers.find(p => p.id === spaceId);
    if (existingPointer) {
      // Space already exists, just switch to it
      await this.switchToSpace(spaceId);
      return spaceId;
    }

    // Create pointer for the file system space
    const pointer: SpacePointer = {
      id: spaceId,
      uri: path, // File system path as URI triggers dual persistence
      name: null, // Will be loaded from space data
      createdAt: new Date(), // Will be updated from space data
      userId: this.auth.user?.id || null,
    };

    // Create persistence layers based on URI (will be IndexedDB + FileSystem)
    const persistenceLayers = createPersistenceLayersForURI(spaceId, path);

    // Load the space using SpaceManager
    const space = await this._spaceManager.loadSpace(pointer, persistenceLayers);

    // Update pointer with actual space metadata
    pointer.name = space.name || null;
    pointer.createdAt = space.createdAt;

    // Add to our collections
    this.pointers = [...this.pointers, pointer];
    const newSpaceState = new SpaceState(pointer, this._spaceManager);
    this.spaceStates = [...this.spaceStates, newSpaceState];

    // Switch to the loaded space
    await this.switchToSpace(spaceId);

    this._updateInitializationStatus();
    await this._saveState();

    return spaceId;
  }

  /**
   * Initialize the entire client state system
   * Used during app startup - kept for backward compatibility
   */
  async initialize(): Promise<void> {
    // Check authentication state
    await this.auth.checkAuth();

    // If authenticated, set up connections
    if (this.auth.isAuthenticated) {
      // @TODO: implement connection to server
    }

    // Load theme for current space
    if (this.currentSpaceState) {
      await this.currentSpaceState.theme.loadSpaceTheme(this.currentSpaceState.pointer.id);
    }
  }

  /**
   * Cleanup all client state
   * Used during app shutdown or navigation away
   */
  async cleanup(): Promise<void> {
    // Disconnect all spaces since we keep them connected during switching
    for (const spaceState of this.spaceStates) {
      spaceState.disconnect();
    }
    this.currentSpaceState = null;
    // @TODO: implement disconnect from server
  }
}

export const clientState = new ClientState(); 