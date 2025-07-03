import { AuthStore, type User } from './auth.svelte';
import { SpaceStore } from './spaceStore.svelte';
import { SpaceSocketStore } from './spacesocket.svelte';
import { ThemeStore } from './theme.svelte';
import { isDevMode, spaceInspectorOpen } from './devMode';
import { txtStore } from './txtStore';
import { ttabs, sidebar, layoutRefs } from './layout.svelte';
import { setupSwins } from './swinsLayout';
import type { SpacePointer } from "../spaces/SpacePointer";
import { IndexedDBPersistenceLayer } from "../spaces/persistence/IndexedDBPersistenceLayer";
import { initializeDatabase, savePointers, saveConfig } from "$lib/localDb";
import type Space from "@core/spaces/Space";

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

  // Space state (integrated from SpaceStore)
  pointers: SpacePointer[] = $state([]);
  currentSpaceId: string | null = $state(null);
  config: Record<string, unknown> = $state({});

  // Direct references to focused stores
  auth = new AuthStore();
  // Keep existing SpaceStore for now to avoid breaking things
  spaces = new SpaceStore();
  sockets = new SpaceSocketStore();
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

  // Derived current space using SpaceStore's SpaceManager
  currentSpace = $derived.by(() => {
    if (!this.currentSpaceId) return null;
    return this.spaces.spaceManager.getSpace(this.currentSpaceId) || null;
  });

  get theme() {
    return {
      current: {
        colorScheme: this.themeStore.colorScheme,
        themeName: this.themeStore.themeName
      },
      loadSpaceTheme: () => this.themeStore.loadSpaceTheme(this.currentSpaceId),
      setThemeName: (name: string) => this.themeStore.setThemeName(name, this.currentSpaceId),
      setColorScheme: (colorScheme: 'light' | 'dark') => this.themeStore.setColorScheme(colorScheme, this.currentSpaceId)
    };
  }
  dev = {
    isDevMode,
    spaceInspectorOpen
  };
  text = txtStore;

  // Layout and UI orchestration
  layout = {
    ttabs,
    sidebar,
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
      this.currentSpaceId = currentSpaceId;
      this.config = config;

      // Also update the legacy SpaceStore for compatibility
      this.spaces.setInitialState({ pointers, currentSpaceId, config });

      // Check authentication and filter spaces
      await this.auth.checkAuth();
      if (this.auth.isAuthenticated) {
        this.sockets.setupSocketConnection();
        await this.spaces.filterSpacesForCurrentUser();
        // Sync pointers from SpaceStore after filtering
        this.pointers = this.spaces.pointers;
        this.currentSpaceId = this.spaces.currentSpaceId;
      }

      // Load theme for current space
      await this.theme.loadSpaceTheme();

      // Set final status
      this._updateInitializationStatus();

    } catch (error) {
      console.error('Failed to initialize client state:', error);
      this._initializationStatus = "error";
      this._initializationError = error instanceof Error ? error.message : String(error);
    }
  }

  /**
   * Create a new local space using SpaceManager directly
   */
  async createNewLocalSpace(): Promise<string> {
    // Create space directly via SpaceManager
    const space = await this.spaces.spaceManager.createSpace();
    const spaceId = space.getId();

    // Set up IndexedDB persistence directly
    const indexedDBLayer = new IndexedDBPersistenceLayer(spaceId);
    await indexedDBLayer.connect();
    const initialOps = space.tree.getAllOps();
    await indexedDBLayer.saveTreeOps(spaceId, initialOps);
    this.spaces.spaceManager.addPersistenceLayer(spaceId, indexedDBLayer);

    // Add pointer and set as current
    const pointer: SpacePointer = {
      id: spaceId,
      uri: "local://" + spaceId,
      name: space.name || null,
      createdAt: space.createdAt,
      userId: this.auth.user?.id || null,
    };

    this.pointers = [...this.pointers, pointer];
    this.currentSpaceId = spaceId;

    // Also update legacy SpaceStore for compatibility
    this.spaces.addSpacePointer(pointer);
    this.spaces.currentSpaceId = spaceId;

    this._updateInitializationStatus();

    // Explicitly save after changes
    await this._saveState();

    return spaceId;
  }

  /**
   * Load a space using SpaceManager directly  
   */
  async loadSpace(pointer: SpacePointer): Promise<Space | null> {
    // Check if already loaded
    let space = this.spaces.spaceManager.getSpace(pointer.id);
    if (space) return space;

    // Load local spaces directly
    if (pointer.uri.startsWith("local://")) {
      try {
        const indexedDBLayer = new IndexedDBPersistenceLayer(pointer.id);
        space = await this.spaces.spaceManager.loadSpace(pointer, [indexedDBLayer]);
        return space;
      } catch (error) {
        console.error("Failed to load space", pointer, error);
        return null;
      }
    }

    // For non-local spaces, fall back to existing logic for now
    return await this.spaces.loadSpace(pointer);
  }

  /**
   * Remove a space by ID
   */
  async removeSpace(spaceId: string): Promise<void> {
    // Remove from our pointers
    this.pointers = this.pointers.filter(p => p.id !== spaceId);

    // Update current space if it was removed
    if (this.currentSpaceId === spaceId) {
      this.currentSpaceId = this.pointers.length > 0 ? this.pointers[0].id : null;
    }

    // Also update legacy SpaceStore
    await this.spaces.removeSpace(spaceId);
    this.spaces.currentSpaceId = this.currentSpaceId;

    // Update status and save
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

    // Update loaded space if exists
    const space = this.spaces.spaceManager.getSpace(spaceId);
    if (space) {
      space.name = name;
    }

    // Save changes
    await this._saveState();
  }

  private _updateInitializationStatus(): void {
    if (this.pointers.length === 0) {
      this._initializationStatus = "needsSpace";
    } else {
      // Ensure we have a current space selected
      if (!this.currentSpaceId) {
        this.currentSpaceId = this.pointers[0].id;
        this.spaces.currentSpaceId = this.pointers[0].id; // Keep legacy in sync
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
        saveConfig(this.config)
      ]);
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }

  /**
   * Orchestrated sign-in workflow
   * Handles: auth → space filtering → theme loading → socket connection
   */
  async signIn(tokens: AuthTokens, user: User): Promise<void> {
    await this.auth.setAuth(tokens, user);
    await this.spaces.filterSpacesForCurrentUser();
    // Sync pointers after filtering
    this.pointers = this.spaces.pointers;
    this.currentSpaceId = this.spaces.currentSpaceId;
    this._updateInitializationStatus();
    await this.theme.loadSpaceTheme();
    this.sockets.setupSocketConnection();

    // Save state after sign-in changes
    await this._saveState();
  }

  /**
   * Orchestrated sign-out workflow
   * Handles: auth logout → space filtering → socket cleanup → theme reset
   */
  async signOut(): Promise<void> {
    await this.auth.logout();
    await this.spaces.handleUserSignOut();
    // Sync pointers after sign out
    this.pointers = this.spaces.pointers;
    this.currentSpaceId = this.spaces.currentSpaceId;
    this._updateInitializationStatus();
    this.sockets.cleanupSocketConnection();
    await this.theme.loadSpaceTheme(); // Reset to defaults

    // Save state after sign-out changes
    await this._saveState();
  }

  /**
   * Orchestrated space switching workflow
   * Handles: space selection → theme loading → potential sync updates
   */
  async switchSpace(spaceId: string): Promise<void> {
    this.currentSpaceId = spaceId;
    this.spaces.currentSpaceId = spaceId; // Keep legacy in sync
    await this.theme.loadSpaceTheme();

    // Save the current space selection
    await this._saveState();

    // Future: Could trigger layout updates, sync state, etc.
    // this.layout.ttabs.refreshLayout();
    // await this.syncSpaceState(spaceId);
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
      this.sockets.setupSocketConnection();
    }

    // Load theme for current space
    await this.theme.loadSpaceTheme();
  }

  /**
   * Cleanup all client state
   * Used during app shutdown or navigation away
   */
  async cleanup(): Promise<void> {
    await this.spaces.disconnectAllSpaces();
    this.sockets.cleanupSocketConnection();
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
      currentSpace: this.currentSpace?.name || null,
      theme: this.theme.current.themeName,
      colorScheme: this.theme.current.colorScheme,
      connected: this.sockets.socketConnected,
      layoutReady: !!this.layout.layoutRefs.contentGrid
    };
  }


  /**
   * Check if current space is ready for use
   */
  get isCurrentSpaceReady(): boolean {
    return !!(this.currentSpaceId && this.currentSpace);
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