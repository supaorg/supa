# Client State Orchestration Hub

## Overview

Proposal to create a centralized orchestration layer for client-side state management while maintaining focused, modular stores. This addresses the current scattered state management across multiple stores and provides a single entry point for complex cross-system workflows, including database initialization and comprehensive space state management.

## Current State Management Landscape

### Global Stores
- **`authStore`** - Authentication state (user, tokens, auth status)
- **`spaceStore`** - Space management (pointers, current space, lazy loading)
- **`spaceSocketStore`** - WebSocket connections for server sync
- **`theme`** - Theme and color scheme management per space
- **`devMode`** - Development mode flag
- **`txtStore`** - Localization/text content

### Database Layer
- **`localDb.ts`** - IndexedDB operations for spaces, config, operations, secrets
- **Database initialization** currently handled in components (SpaceEntry.svelte)

### Layout/UI State
- **`ttabs`** - Tab layout management with validation
- **`sidebar`** - Sidebar state (open/closed, width)
- **`layoutRefs`** - Layout references for ttabs coordination
- **`swins`** - Window stack management for modal-like interfaces

### Component State (30+ components)
Local reactive state for forms, UI interactions, loading states, modal states, etc.

### Current Issues
1. **Scattered Imports** - Components import multiple stores directly
2. **Manual Coordination** - Complex workflows require manual orchestration across stores
3. **Hidden Dependencies** - Cross-system effects not obvious (auth changes → space filtering → theme loading)
4. **Split Loading Logic** - Database initialization in components, not centralized
5. **Fragmented Space State** - Space pointers separate from layout/theme/other space data
6. **Testing Complexity** - Mocking multiple stores for tests
7. **Inconsistent Patterns** - Different components handle cross-store coordination differently

## Proposed Solution: Orchestration Hub with Integrated Space State

Create a central `ClientState` class that orchestrates existing stores while maintaining focused modularity, with comprehensive space state management and centralized database initialization.

### Architecture

```typescript
// clientState.svelte.ts

type InitializationStatus = "initializing" | "needsSpace" | "ready" | "error";

interface ClientSpaceState {
  // Basic space info
  id: string;
  uri: string;
  name: string | null;
  createdAt: Date;
  userId: string | null;
  
  // Space-specific state
  ttabsLayout?: string | null;
  theme?: string | null;
  colorScheme?: 'light' | 'dark' | null;
  drafts?: { [draftId: string]: string } | null;
  
  // Runtime state
  isConnected?: boolean;
  lastSyncTime?: Date;
  isLoading?: boolean;
  
  // Future: cached space data, preferences, etc.
}

export class ClientState {
  // Internal loading state
  private _initializationStatus: InitializationStatus = $state("initializing");
  private _initializationError: string | null = $state(null);
  
  // Space state management
  private _spaces: Map<string, ClientSpaceState> = $state(new Map());
  private _currentSpaceId: string | null = $state(null);
  private _config: Record<string, unknown> = $state({});
  
  // Direct references to focused stores (for specific functionality)
  auth = authStore;
  sockets = spaceSocketStore;
  dev = devMode;
  text = txtStore;
  
  layout = {
    ttabs,
    sidebar, 
    swins,
    layoutRefs,
    
    openSettings: () => {
      this.layout.swins.open('settings', {}, 'Settings');
    },
    openSpaces: () => {
      this.layout.swins.open('spaces', {}, 'Spaces');
    }
  };
  
  // Public loading state accessors
  get initializationStatus(): InitializationStatus {
    return this._initializationStatus;
  }
  
  get isInitializing(): boolean {
    return this._initializationStatus === "initializing";
  }
  
  get needsSpace(): boolean {
    return this._initializationStatus === "needsSpace";
  }
  
  get isReady(): boolean {
    return this._initializationStatus === "ready";
  }
  
  // Space state accessors
  get spaces(): ClientSpaceState[] {
    return Array.from(this._spaces.values());
  }
  
  get currentSpaceId(): string | null {
    return this._currentSpaceId;
  }
  
  set currentSpaceId(id: string | null) {
    this._currentSpaceId = id;
  }
  
  get currentSpace(): ClientSpaceState | null {
    return this._currentSpaceId ? this._spaces.get(this._currentSpaceId) || null : null;
  }
  
  get config(): Record<string, unknown> {
    return this._config;
  }
  
  // Space management
  getSpace(spaceId: string): ClientSpaceState | undefined {
    return this._spaces.get(spaceId);
  }
  
  updateSpaceState(spaceId: string, updates: Partial<ClientSpaceState>): void {
    const current = this._spaces.get(spaceId);
    if (current) {
      this._spaces.set(spaceId, { ...current, ...updates });
    }
  }
  
  addSpace(spaceState: ClientSpaceState): void {
    this._spaces.set(spaceState.id, spaceState);
  }
  
  removeSpace(spaceId: string): void {
    this._spaces.delete(spaceId);
    if (this._currentSpaceId === spaceId) {
      this._currentSpaceId = this.spaces.length > 0 ? this.spaces[0].id : null;
    }
  }
  
  // Orchestrated workflows for complex cross-system operations
  async initialize(): Promise<void> {
    try {
      this._initializationStatus = "initializing";
      this._initializationError = null;

      // Initialize database and load space data
      await this._initializeFromDatabase();

      // Check authentication state
      await this.auth.checkAuth();
      
      // If authenticated, set up connections and filter spaces
      if (this.auth.isAuthenticated) {
        this.sockets.setupSocketConnection();
        await this._filterSpacesForCurrentUser();
      }

      // Update status based on current state
      this._updateInitializationStatus();
      
      // Load theme for current space
      await this._loadCurrentSpaceTheme();

    } catch (error) {
      console.error('Failed to initialize client state:', error);
      this._initializationStatus = "error";
      this._initializationError = error instanceof Error ? error.message : String(error);
    }
  }
  
  async signIn(tokens: AuthTokens, user: User): Promise<void> {
    await this.auth.setAuth(tokens, user);
    await this._filterSpacesForCurrentUser();
    this._updateInitializationStatus();
    await this._loadCurrentSpaceTheme();
    this.sockets.setupSocketConnection();
  }
  
  async signOut(): Promise<void> {
    await this.auth.logout();
    await this._handleUserSignOut();
    this._updateInitializationStatus();
    this.sockets.cleanupSocketConnection();
    await this._loadCurrentSpaceTheme(); // Reset to defaults
  }
  
  async switchSpace(spaceId: string): Promise<void> {
    if (!this._spaces.has(spaceId)) {
      throw new Error(`Space ${spaceId} not found`);
    }
    
    this._currentSpaceId = spaceId;
    await this._loadCurrentSpaceTheme();
    await this._saveDatabaseState();
    
    // Future: Could trigger layout updates, sync state, etc.
    // this.layout.ttabs.refreshLayout();
    // await this.syncSpaceState(spaceId);
  }
  
  async createNewSpace(type: 'local' | 'synced' = 'local'): Promise<string> {
    let spaceId: string;
    
    if (type === 'local') {
      spaceId = await createNewLocalSpace();
    } else {
      spaceId = await createNewSyncedSpace();
    }
    
    // Reload space data to include the new space
    await this._initializeFromDatabase();
    this._updateInitializationStatus();
    await this._loadCurrentSpaceTheme();
    
    return spaceId;
  }
  
  // Internal database operations
  private async _initializeFromDatabase(): Promise<void> {
    try {
      const { pointers, currentSpaceId, config } = await initializeDatabase();
      
      // Convert pointers to ClientSpaceState objects
      this._spaces.clear();
      for (const pointer of pointers) {
        const spaceState: ClientSpaceState = {
          id: pointer.id,
          uri: pointer.uri,
          name: pointer.name,
          createdAt: pointer.createdAt,
          userId: pointer.userId,
          // Additional state will be loaded lazily or from database
        };
        this._spaces.set(pointer.id, spaceState);
      }
      
      this._currentSpaceId = currentSpaceId;
      this._config = config;
      
      // Load additional space-specific data
      await this._loadSpaceSpecificData();
      
    } catch (error) {
      console.error("Failed to initialize from database:", error);
      throw error;
    }
  }
  
  private async _loadSpaceSpecificData(): Promise<void> {
    // Load additional data for each space (theme, layout, etc.)
    for (const [spaceId, spaceState] of this._spaces) {
      try {
        const spaceSetup = await getSpaceSetup(spaceId);
        if (spaceSetup) {
          this._spaces.set(spaceId, {
            ...spaceState,
            ttabsLayout: spaceSetup.ttabsLayout,
            theme: spaceSetup.theme,
            colorScheme: spaceSetup.colorScheme,
            drafts: spaceSetup.drafts,
          });
        }
      } catch (error) {
        console.warn(`Failed to load data for space ${spaceId}:`, error);
      }
    }
  }
  
  private async _saveDatabaseState(): Promise<void> {
    try {
      // Save current space selection
      await saveCurrentSpaceId(this._currentSpaceId);
      
      // Save config
      await saveConfig(this._config);
      
      // Save space pointers (convert from ClientSpaceState)
      const pointers = this.spaces.map(space => ({
        id: space.id,
        uri: space.uri,
        name: space.name,
        createdAt: space.createdAt,
        userId: space.userId
      }));
      await savePointers(pointers);
      
    } catch (error) {
      console.error("Failed to save database state:", error);
    }
  }
  
  private _updateInitializationStatus(): void {
    if (this._initializationStatus === "initializing") {
      return;
    }

    if (this._spaces.size === 0) {
      this._initializationStatus = "needsSpace";
    } else {
      // Ensure we have a current space selected
      if (!this._currentSpaceId && this._spaces.size > 0) {
        this._currentSpaceId = this.spaces[0].id;
      }
      this._initializationStatus = "ready";
    }
  }
  
  private async _filterSpacesForCurrentUser(): Promise<void> {
    if (!this.auth.user) return;
    
    const userPointers = await getPointersForUser(this.auth.user.id);
    
    // Update spaces to only include user's spaces
    this._spaces.clear();
    for (const pointer of userPointers) {
      const spaceState: ClientSpaceState = {
        id: pointer.id,
        uri: pointer.uri,
        name: pointer.name,
        createdAt: pointer.createdAt,
        userId: pointer.userId,
      };
      this._spaces.set(pointer.id, spaceState);
    }
    
    // Reload space-specific data
    await this._loadSpaceSpecificData();
  }
  
  private async _handleUserSignOut(): Promise<void> {
    // Filter spaces to only show local spaces (userId === null)
    const localSpaces = new Map();
    for (const [id, space] of this._spaces) {
      if (space.userId === null) {
        localSpaces.set(id, space);
      }
    }
    this._spaces = localSpaces;
    
    // Update current space if it's no longer available
    if (this._currentSpaceId && !this._spaces.has(this._currentSpaceId)) {
      this._currentSpaceId = this._spaces.size > 0 ? this.spaces[0].id : null;
    }
  }
  
  private async _loadCurrentSpaceTheme(): Promise<void> {
    const currentSpace = this.currentSpace;
    if (currentSpace?.theme) {
      setThemeName(currentSpace.theme);
    }
    if (currentSpace?.colorScheme) {
      setColorScheme(currentSpace.colorScheme);
    }
    // Fallback to default theme loading
    await loadSpaceTheme();
  }
  
  // Space-specific operations
  async updateSpaceTheme(spaceId: string, theme: string): Promise<void> {
    this.updateSpaceState(spaceId, { theme });
    await saveSpaceTheme(spaceId, theme);
    
    if (spaceId === this._currentSpaceId) {
      setThemeName(theme);
    }
  }
  
  async updateSpaceColorScheme(spaceId: string, colorScheme: 'light' | 'dark'): Promise<void> {
    this.updateSpaceState(spaceId, { colorScheme });
    await saveSpaceColorScheme(spaceId, colorScheme);
    
    if (spaceId === this._currentSpaceId) {
      setColorScheme(colorScheme);
    }
  }
  
  async updateSpaceLayout(spaceId: string, layout: string): Promise<void> {
    this.updateSpaceState(spaceId, { ttabsLayout: layout });
    await saveTtabsLayout(spaceId, layout);
  }
  
  async saveDraft(spaceId: string, draftId: string, content: string): Promise<void> {
    const space = this._spaces.get(spaceId);
    if (space) {
      const drafts = { ...space.drafts, [draftId]: content };
      this.updateSpaceState(spaceId, { drafts });
      await saveDraft(spaceId, draftId, content);
    }
  }
  
  async cleanup(): Promise<void> {
    await this._saveDatabaseState();
    this.sockets.cleanupSocketConnection();
  }
  
  // Cross-system reactive derivations
  get isFullyInitialized(): boolean {
    return this.auth.isAuthenticated !== undefined && this._spaces.size >= 0;
  }
  
  get currentSpaceThemeInfo() {
    return {
      space: this.currentSpace,
      theme: this.currentSpace?.theme || 'skeleton',
      colorScheme: this.currentSpace?.colorScheme || 'light',
      spaceId: this._currentSpaceId
    };
  }
  
  get canCreateSpaces(): boolean {
    return this.auth.isAuthenticated || this.spaces.some(s => s.userId === null);
  }
  
  get currentWorkspaceStatus() {
    return {
      initializationStatus: this._initializationStatus,
      user: this.auth.user,
      spaceCount: this._spaces.size,
      currentSpace: this.currentSpace?.name || null,
      theme: this.currentSpace?.theme || 'skeleton',
      colorScheme: this.currentSpace?.colorScheme || 'light',
      connected: this.sockets.socketConnected,
      layoutReady: !!this.layout.layoutRefs.contentGrid
    };
  }
}

export const clientState = new ClientState();
```

### Migration Strategy

#### Phase 1: Create Hub with Space State
1. Create `clientState.svelte.ts` with ClientSpaceState management
2. Integrate database initialization into clientState
3. Add coordinated workflow methods

#### Phase 2: Component Migration
1. Update SpaceEntry.svelte to use clientState loading status
2. Replace spaceStore usage with clientState.spaces
3. Update components to use ClientSpaceState instead of pointers

#### Phase 3: Advanced Space State
1. Add more space-specific state management
2. Implement space state persistence
3. Add space-specific reactive derivations

## Benefits

### 1. **Centralized Initialization**
```typescript
// Before: Split between component and stores
// SpaceEntry.svelte: initializeDatabase(), complex status management
// clientState: only auth/sockets

// After: Single initialization point
await clientState.initialize();
// Handles database, auth, spaces, theme, sockets
```

### 2. **Comprehensive Space State**
```typescript
// Before: Separate space pointers and space-specific data
const pointer = spaceStore.getPointer(id);
const layout = await getTtabsLayout(id);
const theme = await getSpaceTheme(id);

// After: Unified space state
const space = clientState.getSpace(id);
// Contains: id, name, layout, theme, colorScheme, drafts, etc.
```

### 3. **Simplified Components**
```typescript
// Before: Complex loading state management in SpaceEntry
let status: Status = $state("initializing");
// ... complex effects and transitions

// After: Simple observation
{#if clientState.isInitializing}
  <Loading />
{:else if clientState.needsSpace}
  <FreshStartWizard />
{:else if clientState.isReady}
  <Space />
{/if}
```

### 4. **Better Space Operations**
```typescript
// Before: Manual coordination
await saveSpaceTheme(spaceId, theme);
if (spaceId === currentSpaceId) {
  setThemeName(theme);
}

// After: Coordinated operation
await clientState.updateSpaceTheme(spaceId, theme);
// Handles state update, persistence, and theme application
```

## Implementation Details

### File Structure
```
src/lib/
├── clientState.svelte.ts          # New orchestration hub with space state
├── stores/                        # Existing stores (reduced scope)
│   ├── auth.svelte.ts
│   └── ...
├── spaces/
│   └── spaceStore.svelte.ts      # May be deprecated/reduced
├── localDb.ts                     # Database operations (unchanged)
└── ...
```

### Component Usage Patterns
```typescript
// Component usage
<script lang="ts">
  import { clientState } from '$lib/clientState.svelte';
  
  // Access space state
  const currentSpace = clientState.currentSpace;
  const allSpaces = clientState.spaces;
  
  // Use orchestrated workflows
  async function switchToSpace(spaceId: string) {
    await clientState.switchSpace(spaceId);
    // Handles theme loading, persistence, etc.
  }
  
  async function updateLayout(layout: string) {
    if (currentSpace) {
      await clientState.updateSpaceLayout(currentSpace.id, layout);
    }
  }
</script>
```

### Database Integration
- **Centralized Loading**: All database initialization in clientState.initialize()
- **Automatic Persistence**: Space state changes automatically saved
- **Error Recovery**: Database errors handled centrally with proper fallbacks
- **Performance**: Lazy loading of space-specific data

## New Scope Considerations

### What Gets Centralized
- **Database initialization** and error recovery
- **Space state management** (comprehensive ClientSpaceState objects)
- **Cross-system workflows** (sign-in/out, space switching, theme changes)
- **Space-specific operations** (theme, layout, drafts)
- **State persistence** coordination

### What Stays Modular
- **Auth implementation** (kept in authStore)
- **Socket management** (kept in spaceSocketStore)  
- **Component-specific state** (forms, UI toggles)
- **Database operations** (kept in localDb.ts)

## Success Metrics

1. **Simplified Loading Logic** - Remove complex state management from SpaceEntry
2. **Unified Space State** - Single source for all space-related data
3. **Centralized Database Logic** - All initialization in one place
4. **Better Error Handling** - Centralized error recovery for initialization
5. **Improved Developer Experience** - Single API for space operations
6. **Performance Stability** - Efficient space state management

## Conclusion

The enhanced Orchestration Hub with integrated space state management and database initialization provides a comprehensive solution to current client state complexity. It centralizes initialization logic, provides unified space state management, and maintains clean separation of concerns while significantly simplifying component logic. 