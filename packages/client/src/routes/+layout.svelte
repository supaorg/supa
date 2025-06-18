<script lang="ts">
  import "../app.css";
  import ThemeManager from "$lib/comps/themes/ThemeManager.svelte";
  import { swins } from "$lib/swins";
  import SwinsContainer from "$lib/swins/SwinsContainer.svelte";
  import { onMount } from "svelte";
  import { destroyShortcuts, initShortcuts } from "$lib/shortcuts/shortcuts";
  import { authStore } from "$lib/stores/auth.svelte";
  import { api } from "$lib/utils/api";
  import { savePointers } from "$lib/localDb";

  let { children } = $props();

  onMount(() => {
    initShortcuts();

    // Fetch spaces when authenticated
    if (authStore.isAuthenticated) {
      fetchSpaces();
    }

    return () => {
      destroyShortcuts();
    };
  });

  async function fetchSpaces() {
    try {
      const response = await api.get('/spaces');
      if (response.success && response.data) {
        // Transform spaces to SpacePointer format
        const spaces = response.data.map((space: any) => ({
          id: space.id,
          uri: `http://localhost:3131/spaces/${space.id}`,
          name: space.name,
          createdAt: new Date(space.createdAt)
        }));
        
        // Save to local database
        await savePointers(spaces);
      }
    } catch (error) {
      console.error('Failed to fetch spaces:', error);
    }
  }
</script>

<svelte:head>
  <title>t69</title>
  <meta name="description" content="t69" />
</svelte:head>

<!-- Check for a theme and load it (either the default or the space theme) -->
<ThemeManager />

<!-- Setup stacking windows (popover windows with navigation) we use for new conversations, settings, etc -->
<SwinsContainer {swins} />

{@render children?.()}
