# New Client State Architecture Proposal

## Overview

This proposal outlines a refined client state architecture that builds upon the recent orchestration hub refactoring. The new design introduces `SpaceState` encapsulation to better organize space-specific concerns and implements lazy loading for improved performance.

## Current Issues

After the initial refactoring, we still have some architectural issues:

1. **Global Theme/Layout Stores**: Theme and layout are still global, but they should be space-specific
2. **All Spaces Loaded**: Currently all spaces in the list are loaded/connected, even when not active
3. **Scattered Space Concerns**: Space-related functionality (theme, layout, etc.) spread across multiple stores
4. **Complex API**: Need to access `clientState.spaces.currentSpace.theme` instead of cleaner `clientState.currentSpace.theme`

## Proposed Architecture

### Core Structure

```typescript
clientState
├── status: 'initializing' | 'ready' | 'needs-space'
├── spaces: SpaceState[]           // Array of space states (mostly unloaded)
└── currentSpace: SpaceState | null // Only the active/connected space

SpaceState
├── constructor(pointer: SpacePointer)
├── space: Space | null           // Lazy loaded
├── theme: ThemeStore            // Space-specific theme instance
├── layout: LayoutStore          // Space-specific layout instance  
└── connect() / disconnect()     // Load/unload space data
```

### Usage Examples

```typescript
// Clean, intuitive API
client.currentSpace.layout.openChatTab(treeId, 'New Chat')
client.currentSpace.layout.sidebar.toggle()
client.currentSpace.theme.setColorScheme('dark', client.currentSpace.pointer.id)
client.currentSpace.space.createThread()

// Switch spaces (lazy loading)
await client.switchToSpace(spacePointer)
```

## Implementation Details

### 1. SpaceState Class

```typescript
import { ThemeStore } from './theme.svelte.ts'
import { LayoutStore } from './layout.svelte.ts'

class SpaceState {
  pointer: SpacePointer
  space: Space | null = null
  theme: ThemeStore
  layout: LayoutStore
  isConnected: boolean = false

  constructor(pointer: SpacePointer) {
    this.pointer = pointer
    this.theme = new ThemeStore()
    this.layout = new LayoutStore(pointer.id)
  }

  async connect(): Promise<void> {
    if (this.isConnected) return
    
    // Load space data from database
    this.space = await spaceManager.loadSpace(this.pointer)
    
    // Load space-specific theme and layout
    await this.theme.loadSpaceTheme(this.pointer.id)
    await this.layout.loadSpaceLayout()
    
    this.isConnected = true
  }

  disconnect(): void {
    this.space = null
    // Theme and layout instances can persist, but we might want to
    // reset them to defaults or pause their persistence
    this.isConnected = false
  }
}
```

### 2. Enhanced ClientState

```typescript
class ClientState {
  // Status management
  status: 'initializing' | 'ready' | 'needs-space' = $state('initializing')
  
  // Space management
  spaces: SpaceState[] = $state([])
  currentSpace: SpaceState | null = $state(null)
  
  async switchToSpace(pointer: SpacePointer): Promise<void> {
    // Disconnect current space
    if (this.currentSpace) {
      this.currentSpace.disconnect()
    }
    
    // Find or create space state
    let spaceState = this.spaces.find(s => s.pointer.id === pointer.id)
    if (!spaceState) {
      spaceState = new SpaceState(pointer)
      this.spaces.push(spaceState)
    }
    
    // Connect and set as current
    await spaceState.connect()
    this.currentSpace = spaceState
  }
}
```

### 3. Layout Class (Enhanced from existing layout.svelte.ts)

We'll convert the existing `layout.svelte.ts` into a class structure similar to `ThemeStore`.

**Current structure:** Functions and state exported directly (`export const ttabs`, `export const sidebar`, `export function openChatTab`)

**New structure:** Everything wrapped in a `LayoutStore` class with space-specific persistence:

```typescript
// In packages/client/src/lib/state/layout.svelte.ts
export class LayoutStore {
  spaceId: string
  ttabs: TTabs
  layoutRefs: LayoutRefs = $state({ contentGrid: undefined, sidebarColumn: undefined })
  sidebar = $state({
    isOpen: true,
    widthWhenOpen: 300,
    // ... existing sidebar methods
  })

  constructor(spaceId: string) {
    this.spaceId = spaceId
    this.ttabs = createTtabs({ /* existing config */ })
    // Initialize with space-specific setup
  }

  async loadSpaceLayout(): Promise<void> {
    // Load layout from IndexedDB for this specific space
    const saved = await getSpaceLayout(this.spaceId)
    if (saved) {
      this.ttabs.deserializeLayout(saved)
    } else {
      this.ttabs.resetToDefaultLayout()
    }
    this.findAndUpdateLayoutRefs()
  }

  async saveLayout(): Promise<void> {
    const layoutJson = this.ttabs.serializeLayout()
    await saveSpaceLayout(this.spaceId, layoutJson)
  }

  openChatTab(treeId: string, name: string): void {
    // ... existing openChatTab logic
  }

  // ... other layout methods from current layout.svelte.ts
}
```

### 4. Theme Class (Using existing ThemeStore)

The existing `ThemeStore` is already well-structured and can be used directly:

```typescript
// In packages/client/src/lib/state/theme.svelte.ts
export class ThemeStore {
  // Already exists - no changes needed to the class itself
  // Just usage pattern changes in SpaceState
}
```

## Benefits

### 1. **Lazy Loading Performance**
- Only the current space is loaded into memory
- Faster app startup and space switching
- Reduced memory footprint

### 2. **Better Encapsulation**
- Space-specific concerns (theme, layout) are properly encapsulated
- Clear ownership and responsibilities
- Easier testing and maintenance

### 3. **Cleaner API**
- Intuitive access patterns: `client.currentSpace.layout`
- No need to navigate complex nested stores
- More discoverable functionality

### 4. **Space-Specific State**
- Each space has its own theme and layout
- No conflicts between spaces
- Better isolation and debugging

### 5. **Simplified Components**
- Components just observe `clientState.currentSpace`
- No need to coordinate multiple stores
- Cleaner reactive dependencies

## Migration Strategy

Since this is a breaking architectural change, we'll implement it directly:

### Phase 1: Create New Classes
1. Create `SpaceState` class that uses existing `ThemeStore` and new `LayoutStore`
2. Convert `layout.svelte.ts` from function exports to `LayoutStore` class (similar to existing `ThemeStore`)
3. Update `ClientState` with new space management
4. Keep existing theme/layout functionality unchanged

### Phase 2: Update Components
1. Update components to use `clientState.currentSpace.*`
2. Remove dependencies on old theme/layout stores
3. Update space switching logic

### Phase 3: Cleanup
1. Remove old `ThemeStore`, layout stores
2. Clean up obsolete imports and references
3. Update tests

## File Changes

### New Files
- `packages/client/src/lib/state/SpaceState.ts`

### Modified Files
- `packages/client/src/lib/state/layout.svelte.ts` - Convert to `LayoutStore` class (similar to existing `ThemeStore`)
- `packages/client/src/lib/state/theme.svelte.ts` - No changes to `ThemeStore` class, just usage pattern
- `packages/client/src/lib/state/clientState.svelte.ts` - Enhanced space management with `SpaceState`
- `packages/client/src/lib/comps/SpaceEntry.svelte` - Use new current space API
- `packages/client/src/lib/comps/apps/Space.svelte` - Update space access patterns
- Components accessing theme/layout - Update to use `clientState.currentSpace.*`

### Files That Stay (No Removal)
- Keep existing `theme.svelte.ts` and `layout.svelte.ts` - they become space-specific instances
- No obsolete files to remove - we're enhancing the existing architecture

## Implementation Notes

1. **Persistence**: Leverage existing persistence from `ThemeStore.loadSpaceTheme()` and new `LayoutStore.loadSpaceLayout()` methods
2. **Reactivity**: All state uses Svelte 5 runes for proper reactivity (already implemented in current stores)
3. **Error Handling**: Robust error handling for space loading/connection failures
4. **Memory Management**: Proper cleanup when disconnecting spaces
5. **Type Safety**: Full TypeScript coverage for all new classes
6. **Backward Compatibility**: Existing `ThemeStore` methods work unchanged, just called per-space instead of globally

## Expected Outcomes

- **Performance**: Faster app startup and space switching
- **Maintainability**: Cleaner, more organized codebase
- **Developer Experience**: More intuitive API for accessing space state
- **Scalability**: Better architecture for adding new space-specific features
- **Testing**: Easier unit testing with better separation of concerns

This architecture provides a solid foundation for future enhancements while solving current organizational and performance issues. 