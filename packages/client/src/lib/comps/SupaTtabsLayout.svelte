<script lang="ts">
  import { TtabsRoot } from "ttabs-svelte";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import { savePointers } from "$lib/localDb";
  import { ttabs, setupTtabs } from "$lib/ttabs/ttabsLayout";
  import { onDestroy, untrack } from "svelte";

  let unsubscribe: (() => void) | null = null;
  let lastSavedLayout: string | null = null;

  // Load layout for the current space
  function loadLayout(spaceId: string): boolean {
    // Find the pointer for this space
    const pointer = spaceStore.pointers.find((p) => p.id === spaceId);

    /*
    if (pointer?.ttabsLayout) {
      // Save the layout to compare later for changes
      lastSavedLayout = pointer.ttabsLayout;
      
      // Deserialize the layout
      return ttabs.deserializeLayout(pointer.ttabsLayout);
    }
    */

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
      const pointerIndex = pointers.findIndex((p) => p.id === pointer.id);

      if (pointerIndex >= 0) {
        // Update the pointer with the layout
        pointers[pointerIndex] = {
          ...pointers[pointerIndex],
          //ttabsLayout: layoutJson
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
      //saveCurrentLayout();
    });
  }

  $effect(() => {
    const spaceId = spaceStore.currentSpaceId;

    untrack(() => { 
      setupLayout(spaceId);
    });
  });

  function setupLayout(spaceId: string | null): void {
    console.log("Setting up layout for space", spaceId);

    if (!spaceId) {
      ttabs.resetState();
      return;
    }

    setupTtabs();

    /*
    console.log("Loading layout for space", spaceId);
    // Try to load saved layout
    const layoutLoaded = loadLayout(spaceId);
    
    // If no saved layout exists, create default
    if (!layoutLoaded) {
      //setupTtabs();
    }
    
    // Subscribe to layout changes
    subscribeToTtabs();
    */
  }

  /*
  $effect(() => {
    console.log("Ttabs layout changed, tiles: ", ttabs.tiles);
  });
  */

  onDestroy(() => {
    unsubscribe?.();
  });
</script>

<TtabsRoot {ttabs} />
