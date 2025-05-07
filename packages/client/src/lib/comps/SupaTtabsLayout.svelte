<script lang="ts">
  import { TtabsRoot } from "ttabs-svelte";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import { getTtabsLayout, saveTtabsLayout } from "$lib/localDb";
  import { ttabs, setupTtabs } from "$lib/ttabs/ttabsLayout";
  import { onDestroy, untrack } from "svelte";

  let unsubscribe: (() => void) | null = null;
  let lastSavedLayout: string | null = null;

  // Load layout for the current space
  async function loadLayout(spaceId: string): Promise<boolean> {
    try {
      // Get the ttabsLayout directly from the database
      const ttabsLayout = await getTtabsLayout(spaceId);

      if (ttabsLayout) {
        // Save the layout to compare later for changes
        lastSavedLayout = ttabsLayout;
        
        // Deserialize the layout
        return ttabs.deserializeLayout(ttabsLayout);
      }
      return false;
    } catch (error) {
      console.error('Failed to load layout:', error);
      return false;
    }
  }

  // Save the current layout
  async function saveCurrentLayout(): Promise<void> {
    const spaceId = spaceStore.currentSpaceId;
    if (!spaceId) return;

    // Serialize the current layout
    const layoutJson = ttabs.serializeLayout();

    // Only save if the layout has changed
    if (layoutJson !== lastSavedLayout) {
      lastSavedLayout = layoutJson;

      console.log("Layout changed, saving: ", layoutJson);

      // Save to database
      await saveTtabsLayout(spaceId, layoutJson);
    }
  }

  function subscribeToTtabs(): void {
    if (unsubscribe) {
      unsubscribe();
    }

    unsubscribe = ttabs.subscribe(() => {
      saveCurrentLayout();
    });
  }

  $effect(() => {
    const spaceId = spaceStore.currentSpaceId;

    untrack(() => { 
      setupLayout(spaceId);
    });
  });

  async function setupLayout(spaceId: string | null): Promise<void> {
    console.log("Setting up layout for space", spaceId);

    if (!spaceId) {
      ttabs.resetState();
      return;
    }

    console.log("Loading layout for space", spaceId);
    // Try to load saved layout
    const layoutLoaded = await loadLayout(spaceId);
    
    // If no saved layout exists, create default
    if (!layoutLoaded) {
      setupTtabs();
    }
    
    // Subscribe to layout changes
    subscribeToTtabs();
  }

  onDestroy(() => {
    unsubscribe?.();
  });
</script>

<TtabsRoot {ttabs} />
