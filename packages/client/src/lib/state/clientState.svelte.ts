import { AuthStore, type User } from './auth.svelte';
import { ThemeStore } from './theme.svelte';
import { SpaceState } from './SpaceState';
import { isDevMode, spaceInspectorOpen } from './devMode';
import { txtStore } from './txtStore';
import { ttabs, sidebar, layoutRefs } from './layout.svelte';
import { setupSwins } from './swinsLayout';
import type { SpacePointer } from "../spaces/SpacePointer";
import { IndexedDBPersistenceLayer } from "../spaces/persistence/IndexedDBPersistenceLayer";
import { initializeDatabase, savePointers, saveConfig, deleteSpace, saveCurrentSpaceId } from "$lib/localDb";
import { SpaceManager } from "@core/spaces/SpaceManager";
import type Space from '@core/spaces/Space';

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

type InitializationStatus = "initializing" | "needsSpace" | "ready" | "error";

/**
 * Central orchestration hub for client-side state management.
 * Coordinates multiple focused stores and provides unified workflows.
 */
export class ClientState {
  // Internal initialization state
  private _initializationStatus: InitializationStatus = $state("initializing");
  private _initializationError: string | null = $state(null);

  // Core space management
  private spaceManager = new SpaceManager();
  spaceStates: SpaceState[] = $state([]);
  currentSpaceState: SpaceState | null = $state(null);
  currentSpace: Space | null = $derived(this.currentSpaceState?.space || null);

  // Space data
  pointers: SpacePointer[] = $state([]);
  currentSpaceId: string | null = $derived(this.currentSpaceState?.pointer.id || null);
  config: Record<string, unknown> = $state({});

  // Direct references to focused stores
  auth = new AuthStore();
  private themeStore = new ThemeStore();

  // Status getters for components
  get isInitializing(): boolean {
    return this._initializationStatus === "initializing";
  }

  get needsSpace(): boolean {
    return this._initializationStatus === "needsSpace";
  }

  get isReady(): boolean {
    return this._initializationStatus === "ready";
  }

  get initializationError(): string | null {
    return this._initializationError;
  }

  get theme() {
    // Use current space's theme if available, otherwise global theme
    if (this.currentSpaceState) {
      return {
        current: {
          colorScheme: this.currentSpaceState.theme.colorScheme,
          themeName: this.currentSpaceState.theme.themeName
        },
        setThemeName: (name: string) => this.currentSpaceState!.theme.setThemeName(name, this.currentSpaceState!.pointer.id),
        setColorScheme: (colorScheme: 'light' | 'dark') => this.currentSpaceState!.theme.setColorScheme(colorScheme, this.currentSpaceState!.pointer.id)
      };
    } else {
      return {
        current: {
          colorScheme: this.themeStore.colorScheme,
          themeName: this.themeStore.themeName
        },
        setThemeName: (name: string) => this.themeStore.setThemeName(name, this.currentSpaceId),
        setColorScheme: (colorScheme: 'light' | 'dark') => this.themeStore.setColorScheme(colorScheme, this.currentSpaceId)
      };
    }
  }

  dev = {
    isDevMode,
    spaceInspectorOpen
  };
  text = txtStore;

  // Layout and UI orchestration
  layout = {
    get ttabs() {
      return clientState.currentSpaceState?.layout.ttabs || ttabs;
    },
    get sidebar() {
      return clientState.currentSpaceState?.layout.sidebar || sidebar;
    },
    swins: setupSwins(),
    layoutRefs,

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
      this.spaceStates = pointers.map(pointer => new SpaceState(pointer, this.spaceManager));

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
   * Create a new local space using SpaceManager directly
   */
  async createNewLocalSpace(): Promise<string> {
    // Create space directly via SpaceManager
    const space = await this.spaceManager.createSpace();
    const spaceId = space.getId();

    // Set up IndexedDB persistence directly
    const indexedDBLayer = new IndexedDBPersistenceLayer(spaceId);
    await indexedDBLayer.connect();
    const initialOps = space.tree.getAllOps();
    await indexedDBLayer.saveTreeOps(spaceId, initialOps);
    this.spaceManager.addPersistenceLayer(spaceId, indexedDBLayer);

    // Create pointer and SpaceState
    const pointer: SpacePointer = {
      id: spaceId,
      uri: "local://" + spaceId,
      name: space.name || null,
      createdAt: space.createdAt,
      userId: this.auth.user?.id || null,
    };

    // Add to our collections
    this.pointers = [...this.pointers, pointer];
    const newSpaceState = new SpaceState(pointer, this.spaceManager);
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
    // Disconnect the space if it's current
    if (this.currentSpaceState?.pointer.id === spaceId) {
      this.currentSpaceState.disconnect();
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
    // Disconnect current space
    if (this.currentSpaceState) {
      this.currentSpaceState.disconnect();
      this.currentSpaceState = null;
    }

    if (!spaceId) return;

    // Find and connect to new space
    const spaceState = this.spaceStates.find(s => s.pointer.id === spaceId);
    if (spaceState) {
      try {
        await spaceState.connect();
        this.currentSpaceState = spaceState;
      } catch (error) {
        console.error(`Failed to connect to space ${spaceId}:`, error);
        // Don't set currentSpace if connection failed
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
        // Note: We'll connect to it in the next tick
        Promise.resolve().then(() => this._setCurrentSpace(defaultSpaceId));
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
    // Disconnect current space
    if (this.currentSpaceState) {
      this.currentSpaceState.disconnect();
      this.currentSpaceState = null;
    }

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
   * Create new space (local or synced)
   */
  async createNewSpace(type: 'local' | 'synced' = 'local'): Promise<string> {
    if (type === 'local') {
      return await this.createNewLocalSpace();
    } else {
      return await this.createNewSyncedSpace();
    }
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
    // Disconnect all spaces
    for (const spaceState of this.spaceStates) {
      spaceState.disconnect();
    }
    this.currentSpaceState = null;
    // @TODO: implement disconnect from server
  }

  // Cross-system reactive derivations

  /**
   * Check if the application is fully initialized and ready
   */
  get isFullyInitialized(): boolean {
    return this.auth.isAuthenticated !== undefined &&
      this.pointers.length >= 0; // Could be 0 for new users
  }

  /**
   * Get comprehensive current workspace status
   */
  get currentWorkspaceStatus() {
    return {
      user: this.auth.user,
      spaceCount: this.pointers.length,
      currentSpace: this.currentSpaceState?.displayName || null,
      theme: this.theme.current.themeName,
      colorScheme: this.theme.current.colorScheme,
      connected: false,
      layoutReady: !!(this.currentSpaceState?.layout.layoutRefs.contentGrid || this.layout.layoutRefs.contentGrid)
    };
  }

  /**
   * Check if current space is ready for use
   */
  get isCurrentSpaceReady(): boolean {
    return !!(this.currentSpaceState && this.currentSpaceState.isConnected);
  }

  /**
   * Get authentication and space readiness status
   */
  get appReadinessStatus() {
    return {
      authChecked: this.auth.isAuthenticated !== undefined,
      authenticated: this.auth.isAuthenticated,
      hasSpaces: this.pointers.length > 0,
      currentSpaceReady: this.isCurrentSpaceReady,
      fullyReady: this.isFullyInitialized && this.isCurrentSpaceReady
    };
  }
}

export const clientState = new ClientState(); 