# Client State Orchestration Hub

## Overview

Proposal to create a centralized orchestration layer for client-side state management while maintaining focused, modular stores. This addresses the current scattered state management across multiple stores and provides a single entry point for complex cross-system workflows.

## Current State Management Landscape

### Global Stores
- **`authStore`** - Authentication state (user, tokens, auth status)
- **`spaceStore`** - Space management (pointers, current space, lazy loading)
- **`spaceSocketStore`** - WebSocket connections for server sync
- **`theme`** - Theme and color scheme management per space
- **`devMode`** - Development mode flag
- **`txtStore`** - Localization/text content

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
4. **Testing Complexity** - Mocking multiple stores for tests
5. **Inconsistent Patterns** - Different components handle cross-store coordination differently

## Proposed Solution: Orchestration Hub

Create a central `ClientState` class that orchestrates existing stores while keeping them focused and modular.

### Architecture

```typescript
// clientState.svelte.ts
export class ClientState {
  // Direct references to focused stores
  auth = authStore;
  spaces = spaceStore;  
  theme = themeStore;
  sockets = spaceSocketStore;
  dev = devMode;
  text = txtStore;
  
  layout = {
    ttabs,
    sidebar, 
    swins,
    layoutRefs
  };
  
  // Orchestrated workflows for complex cross-system operations
  async signIn(tokens: AuthTokens, user: User) {
    await this.auth.setAuth(tokens, user);
    await this.spaces.filterSpacesForCurrentUser();
    await this.theme.loadSpaceTheme();
    this.sockets.setupSocketConnection();
  }
  
  async signOut() {
    await this.auth.logout();
    await this.spaces.handleUserSignOut(); 
    this.sockets.cleanupSocketConnection();
    await this.theme.loadSpaceTheme(); // Reset to defaults
  }
  
  async switchSpace(spaceId: string) {
    this.spaces.currentSpaceId = spaceId;
    await this.theme.loadSpaceTheme();
    // Could trigger layout updates, sync state, etc.
  }
  
  async createNewSpace(type: 'local' | 'synced' = 'local') {
    if (type === 'local') {
      await createNewLocalSpace();
    } else {
      await createNewSyncedSpace();
    }
    // Space creation functions already handle spaceStore updates
    await this.theme.loadSpaceTheme();
  }
  
  // State derivations that span multiple systems
  get isFullyInitialized() {
    return this.auth.isAuthenticated !== undefined && 
           this.spaces.pointers.length >= 0; // Could be 0 for new users
  }
  
  get currentSpaceThemeInfo() {
    return {
      space: this.spaces.currentSpace,
      theme: this.theme.themeName,
      colorScheme: this.theme.colorScheme
    };
  }
}

export const clientState = new ClientState();
```

### Migration Strategy

#### Phase 1: Create Hub
1. Create `clientState.svelte.ts` with basic orchestration
2. Keep existing stores unchanged
3. Add coordinated workflow methods

#### Phase 2: Component Migration
1. Update components to import `clientState` instead of individual stores
2. Use `clientState.auth`, `clientState.spaces`, etc.
3. Replace manual cross-store coordination with orchestrated methods

#### Phase 3: Advanced Orchestration
1. Add more complex workflow coordination
2. Cross-system reactive derivations
3. Enhanced error handling and recovery

## Benefits

### 1. **Single Entry Point**
```typescript
// Before: Multiple imports
import { authStore } from './stores/auth.svelte';
import { spaceStore } from './spaces/spaceStore.svelte';
import { theme } from './stores/theme.svelte';

// After: Single import
import { clientState } from './clientState.svelte';
```

### 2. **Coordinated Workflows**
```typescript
// Before: Manual coordination scattered across components
await authStore.setAuth(tokens, user);
await spaceStore.filterSpacesForCurrentUser();
await loadSpaceTheme();
spaceSocketStore.setupSocketConnection();

// After: Single orchestrated call
await clientState.signIn(tokens, user);
```

### 3. **Better Testing**
```typescript
// Mock entire client state easily
const mockClientState = {
  auth: { isAuthenticated: true, user: mockUser },
  spaces: { currentSpace: mockSpace, pointers: [] },
  // ... other mocked state
};
```

### 4. **Maintained Modularity**
- Individual stores remain focused and testable
- No breaking changes to existing store APIs
- Clear separation of concerns maintained

### 5. **Enhanced Reactivity**
```typescript
// Cross-system reactive derivations
get canCreateSpaces() {
  return this.auth.isAuthenticated || this.spaces.pointers.some(p => p.userId === null);
}

get currentWorkspaceStatus() {
  return {
    user: this.auth.user,
    spaceCount: this.spaces.pointers.length,
    currentSpace: this.spaces.currentSpace?.name,
    theme: this.theme.themeName,
    connected: this.sockets.socketConnected
  };
}
```

## Implementation Details

### File Structure
```
src/lib/
├── clientState.svelte.ts          # New orchestration hub
├── stores/                        # Existing stores (unchanged)
│   ├── auth.svelte.ts
│   ├── theme.svelte.ts
│   └── ...
├── spaces/
│   └── spaceStore.svelte.ts      # Recently refactored
└── ...
```

### Component Usage Patterns
```typescript
// Component usage
<script lang="ts">
  import { clientState } from '$lib/clientState.svelte';
  
  // Access individual stores
  const user = clientState.auth.user;
  const currentSpace = clientState.spaces.currentSpace;
  
  // Use orchestrated workflows
  async function handleSignOut() {
    await clientState.signOut();
    // All coordination handled automatically
  }
</script>
```

### Backward Compatibility
- Existing direct store imports continue to work
- Migration can be gradual, component by component
- No breaking changes to store APIs

## Scope Considerations

### What Gets Orchestrated
- **Cross-system workflows** (sign-in/out, space switching, theme changes)
- **Complex state derivations** spanning multiple stores
- **Error recovery** patterns across systems
- **Performance optimizations** (batched updates, coordination)

### What Stays Local
- **Component-specific state** (form inputs, UI toggles, loading states)
- **Single-system operations** that don't need coordination
- **Store implementation details** (keep stores focused)

## Future Enhancements

### Advanced Orchestration
- **State snapshots** for debugging/dev tools
- **Undo/redo** across multiple systems
- **Optimistic updates** with rollback coordination
- **Background sync** orchestration

### Development Experience
- **DevTools integration** for state inspection
- **State transition logging** for debugging
- **Performance monitoring** across stores

## Risks & Mitigations

### Risk: God Object Anti-Pattern
**Mitigation**: Keep orchestration focused on coordination, not implementation. Individual stores maintain their responsibilities.

### Risk: Performance Impact
**Mitigation**: Use reactive derivations carefully, add performance monitoring, lazy-load heavy orchestration.

### Risk: Migration Complexity
**Mitigation**: Gradual migration strategy, maintain backward compatibility, clear migration guidelines.

## Timeline

### Week 1: Foundation
- Create basic `ClientState` class with store references
- Implement core workflow methods (signIn, signOut, switchSpace)
- Basic documentation and examples

### Week 2: Integration
- Migrate 2-3 key components as proof of concept
- Add cross-system reactive derivations
- Testing and refinement

### Week 3: Rollout
- Migrate remaining components gradually
- Add advanced orchestration features
- Performance optimization and monitoring

## Success Metrics

1. **Reduced Import Complexity** - Average imports per component decreases
2. **Eliminated Manual Coordination** - Consistent cross-system workflows
3. **Improved Test Coverage** - Easier to mock entire client state
4. **Better Developer Experience** - Single source of truth for client state
5. **Performance Stability** - No regression in app performance

## Conclusion

The Orchestration Hub pattern provides a clean solution to current state management complexity while preserving the benefits of focused, modular stores. It enables better coordination of complex workflows and provides a foundation for future enhancements to the client state management system. 