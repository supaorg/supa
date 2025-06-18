<script lang="ts">
  import "../app.css";
  import ThemeManager from "$lib/comps/themes/ThemeManager.svelte";
  import { swins } from "$lib/swins";
  import SwinsContainer from "$lib/swins/SwinsContainer.svelte";
  import { onMount } from "svelte";
  import { destroyShortcuts, initShortcuts } from "$lib/shortcuts/shortcuts";
  import { authStore } from "$lib/stores/auth.svelte";
  import { api } from "$lib/utils/api";
  import { savePointers, appendTreeOps } from "$lib/localDb";
  import type { SpaceCreationResponse } from "@core/apiTypes";

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

  $effect(() => {
    // Fetch spaces when authenticated
    if (authStore.isAuthenticated) {
      fetchSpaces();
    }
  });

  async function fetchSpaces() {
    try {
      const response = await api.get("/spaces");
      if (response.success && response.data) {
        // Transform spaces to SpacePointer format
        const spaces = response.data.map((space: any) => ({
          id: space.id,
          uri: `http://localhost:3131/spaces/${space.id}`,
          name: space.name,
          createdAt: new Date(space.createdAt),
        }));

        // Fetch details for each space
        for (const space of spaces) {
          console.log(`Fetching details for space ${space.id}`);
          try {
            const spaceResponse = await api.get<SpaceCreationResponse>(
              `/spaces/${space.id}`,
            );
            if (spaceResponse.success && spaceResponse.data) {
              // Save operations for each tree in the space
              const operations = spaceResponse.data.operations;
              if (operations && operations.length > 0) {
                await appendTreeOps(space.id, space.id, operations);
              }
              console.log(
                `Successfully fetched details for space ${space.id}, ops: ${spaceResponse.data.operations.length}`,
              );
            }
          } catch (spaceError) {
            console.error(
              `Failed to fetch details for space ${space.id}:`,
              spaceError,
            );
          }
        }

        // Save to local database
        await savePointers(spaces);
      }
    } catch (error) {
      console.error("Failed to fetch spaces:", error);
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
