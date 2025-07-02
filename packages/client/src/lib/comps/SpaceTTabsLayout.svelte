<script lang="ts">
  import { TTabsRoot } from "ttabs-svelte";
  import { clientState } from "$lib/state/clientState.svelte";
  import { getTtabsLayout, saveTtabsLayout } from "$lib/localDb";
  import { ttabs, setupLayout } from "$lib/state/layout.svelte";
  import { onDestroy, untrack } from "svelte";

  let unsubscribe: (() => void) | null = null;
  let lastSavedLayout: string | null = null;

  async function saveSpaceLayout(): Promise<void> {
    const spaceId = clientState.spaces.currentSpaceId;
    if (!spaceId) return;

    const layoutJson = ttabs.serializeLayout();

    // Only save if the layout has changed
    if (layoutJson !== lastSavedLayout) {
      lastSavedLayout = layoutJson;

      // Save to database
      await saveTtabsLayout(spaceId, layoutJson);
    }
  }

  function subscribeToTtabs(): void {
    if (unsubscribe) {
      unsubscribe();
    }

    unsubscribe = ttabs.subscribe(() => {
      saveSpaceLayout();
    });
  }

  $effect(() => {
    const spaceId = clientState.spaces.currentSpaceId;

    untrack(() => {
      setupSpaceLayout(spaceId);
    });
  });

  async function setupSpaceLayout(spaceId: string | null): Promise<void> {
    if (!spaceId) {
      ttabs.resetTiles();
      return;
    }

    try {
      const ttabsLayout = await getTtabsLayout(spaceId);
      setupLayout(ttabsLayout ?? undefined);
      lastSavedLayout = ttabsLayout ?? null;
    } catch (error) {
      setupLayout();
    }

    subscribeToTtabs();
  }

  onDestroy(() => {
    unsubscribe?.();
  });
</script>

<TTabsRoot {ttabs} />
