# Proposal: Saving and Restoring Ttabs Layouts Per Space

## Overview

This proposal outlines a strategy for serializing and deserializing Ttabs layouts in Supa, allowing users to maintain consistent layouts across space switches and application restarts. The goal is to provide a seamless experience where users can pick up exactly where they left off in each space.

## Current State

Currently, Ttabs layouts in Supa are initialized using the `setupTtabs()` function in `packages/client/src/lib/ttabs/ttabsLayout.ts`, which creates a default layout each time the application starts. When switching between spaces, the layout state is not preserved, resulting in a reset to the default layout.

## Proposed Solution

We will implement a system to:
1. Serialize the Ttabs layout state to JSON when a space is switched or the application is closed
2. Store this state in the existing `localDb` database, extending the `SpacePointer` type
3. Deserialize and restore the layout when returning to a space or restarting the application

## Implementation Details

### 1. Storage Mechanism

We'll extend the `SpacePointer` type to include the Ttabs layout state:

```typescript
// In packages/client/src/lib/spaces/SpacePointer.ts
export type SpacePointer = {
  id: string;
  uri: string;
  name: string | null;
  createdAt: Date;
  ttabsLayout?: string; // Serialized Ttabs layout state
}

// The layout state itself follows Ttabs' serialization format
interface TtabsLayoutState {
  tiles: Tile[];
  metadata: {
    focusedActiveTab: string | null;
  };
}
```

### 2. Wrapper Component Approach

Create a wrapper component around `<TtabsRoot>` that handles layout persistence:

```svelte
<!-- packages/client/src/lib/ttabs/SupaTtabsLayout.svelte -->
<script lang="ts">
  import { TtabsRoot } from "ttabs-svelte";
  import type { Ttabs } from "ttabs-svelte";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import { savePointers } from "$lib/localDb";
  import { setupTtabs } from "./ttabsLayout";
  import { onDestroy } from "svelte";

  // Props
  let { ttabs }: { ttabs: Ttabs } = $props();

  // State
  let unsubscribe: (() => void) | null = null;
  let lastSavedLayout: string | null = null;

  // Load layout for the current space
  function loadLayout(spaceId: string): boolean {
    // Find the pointer for this space
    const pointer = spaceStore.pointers.find(p => p.id === spaceId);
    
    if (pointer?.ttabsLayout) {
      // Save the layout to compare later for changes
      lastSavedLayout = pointer.ttabsLayout;
      
      // Deserialize the layout
      return ttabs.deserializeLayout(pointer.ttabsLayout);
    }
    
    return false;
  }

  // Save the current layout
  function saveCurrentLayout(): void {
    const pointer = spaceStore.currentPointer;
    if (!pointer) return;
    
    // Serialize the current layout
    const layoutJson = ttabs.serializeLayout();
    
    // Only save if the layout has changed
    if (layoutJson !== lastSavedLayout) {
      lastSavedLayout = layoutJson;
      
      // Find the pointer in the pointers array
      const pointers = [...spaceStore.pointers];
      const pointerIndex = pointers.findIndex(p => p.id === pointer.id);
      
      if (pointerIndex >= 0) {
        // Update the pointer with the layout
        pointers[pointerIndex] = {
          ...pointers[pointerIndex],
          ttabsLayout: layoutJson
        };
        
        // Save to localDb
        savePointers(pointers);
        
        // Update the store
        spaceStore.pointers = pointers;
      }
    }
  }

  // Subscribe to ttabs state changes
  function subscribeToTtabs(): void {
    if (unsubscribe) {
      unsubscribe();
    }
    
    unsubscribe = ttabs.subscribe(() => {
      saveCurrentLayout();
    });
  }

  // Initialize layout
  $effect(() => {
    const spaceId = spaceStore.currentSpaceId;
    if (spaceId) {
      // Try to load saved layout
      const layoutLoaded = loadLayout(spaceId);
      
      // If no saved layout exists, create default
      if (!layoutLoaded) {
        setupTtabs();
      }
      
      // Subscribe to layout changes
      subscribeToTtabs();
    }
  });

  // Watch for space changes
  $effect(() => {
    const spaceId = spaceStore.currentSpaceId;
    if (spaceId) {
      // Load layout for the new space
      const layoutLoaded = loadLayout(spaceId);
      
      // If no saved layout exists, create default
      if (!layoutLoaded) {
        setupTtabs();
      }
    }
  });

  // Cleanup on component destroy
  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
</script>

<TtabsRoot {ttabs} />
```
```

### 3. Integration with Supa.svelte

Replace the direct `<TtabsRoot>` usage in Supa.svelte with our new wrapper component:

```svelte
<!-- In packages/client/src/lib/comps/apps/Supa.svelte -->
<script lang="ts">
  import SpaceInspectorWindow from "../space-inspector/SpaceInspectorWindow.svelte";
  import DevPanel from "../dev/DevPanel.svelte";
  import { isDevMode, spaceInspectorOpen } from "$lib/stores/devMode";
  import OllamaAutoConfig from "../models/OllamaAutoConfig.svelte";
  import { ttabs } from "$lib/ttabs/ttabsLayout";
  import SupaTtabsLayout from "$lib/ttabs/SupaTtabsLayout.svelte";
  import SpagesContainer from "$lib/spages/SpagesContainer.svelte";
  import { spages } from "$lib/spages/spagesLayout";
  import ContextMenuHandler from "../ContextMenuHandler.svelte";
  import SidebarToggle from "../sidebar/SidebarToggle.svelte";
</script>

<OllamaAutoConfig />

{#if $isDevMode && $spaceInspectorOpen}
  <SpaceInspectorWindow />
{/if}

<div class="grid h-screen grid-rows-[1fr_auto] border-t border-surface-200-800">
  <div class="flex overflow-hidden">
    <main class="relative flex-grow h-full overflow-y-auto">
      <SupaTtabsLayout {ttabs} />
    </main>
  </div>

  <!-- Rest of the component -->
</div>
```
```

### 4. Application Shutdown Handling

Add a window unload handler in the SupaTtabsLayout component to ensure layouts are saved when the application is closed:

```typescript
// In SupaTtabsLayout.svelte, add to the script section

// Save layout on window unload
const handleBeforeUnload = () => {
  saveCurrentLayout();
};

// Set up event listener
window.addEventListener('beforeunload', handleBeforeUnload);

// Clean up event listener on component destroy
onDestroy(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
  
  if (unsubscribe) {
    unsubscribe();
  }
  
  // Save one last time when component is destroyed
  saveCurrentLayout();
});
```

### 5. Handling Component Registration

Since component registration is required for Ttabs to properly render content, we need to ensure components are registered before deserializing layouts:

```typescript
// Modify ttabsLayoutService.ts
export function loadLayout(spaceId: string): boolean {
  // Ensure components are registered
  ensureComponentsRegistered();
  
  // Rest of the loading logic...
}

function ensureComponentsRegistered(): void {
  // This function ensures all necessary components are registered with ttabs
  // It should be called before deserializing any layout
  
  // Check if components are already registered
  if (!ttabs.hasContentComponent('sidebar')) {
    ttabs.registerComponent('sidebar', Sidebar);
  }
  
  if (!ttabs.hasContentComponent('chat')) {
    ttabs.registerComponent('chat', ChatAppLoader);
  }
  
  // Add any other components that might be needed
}
```

### 6. Cleanup for Deleted Spaces

Ensure layouts are removed when spaces are deleted:

```typescript
// In packages/client/src/lib/spaces/spaceStore.svelte.ts
async removeSpace(pointerId: string): Promise<void> {
  // Existing code...
  
  // Remove from pointers
  this.pointers = this.pointers.filter(p => p.id !== pointerId);
  
  // Save the updated pointers to persist the removal of the layout
  await savePointers(this.pointers);
  
  // Existing code...
}
```

## Considerations

### Integration with localDb

- Using the existing `localDb` for storing layouts leverages the established persistence mechanism
- The `SpacePointer` extension is a natural way to associate layouts with spaces
- This approach maintains the relationship between spaces and their layouts

### Performance

- The layout state is relatively small, so serialization/deserialization should be fast
- We can optimize by only saving layouts when they change, rather than on every space switch

### Storage Size

- The IndexedDB storage used by `localDb` is more suitable for larger data than localStorage
- The cleanup mechanism for deleted spaces will prevent accumulation of unused layouts

### Error Handling

- Add robust error handling for cases where deserialization fails
- Implement a fallback to the default layout if restoration fails
- Handle potential database errors when saving/loading layouts

### Future Extensions

- Consider adding a UI for users to save and restore named layouts
- Allow exporting/importing layouts between devices
- Add layout templates that users can select from

## Implementation Plan

1. Extend the `SpacePointer` type to include the ttabsLayout property
2. Create the `SupaTtabsLayout.svelte` wrapper component
3. Update Supa.svelte to use the new wrapper component
4. Test with multiple spaces and application restarts
5. Add error handling and fallbacks

## Conclusion

This proposal provides a comprehensive approach to persisting Ttabs layouts per space in Supa using the existing `localDb` system. By extending the `SpacePointer` type to include layout information, we maintain a clean architecture while significantly improving the user experience by preserving workspace context across sessions and space switches.
