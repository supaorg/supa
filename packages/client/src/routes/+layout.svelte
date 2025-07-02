<script lang="ts">
  import "../app.css";
  import ThemeManager from "$lib/comps/themes/ThemeManager.svelte";
  import { clientState } from "$lib/state/clientState.svelte";
  import SwinsContainer from "$lib/swins/SwinsContainer.svelte";
  import { onMount } from "svelte";
  import { destroyShortcuts, initShortcuts } from "$lib/shortcuts/shortcuts";
  import { authStore } from "$lib/state/auth.svelte";
  import { fetchSpaces } from "$lib/utils/api";

  let { children } = $props();

  onMount(() => {
    initShortcuts();

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
</script>

<svelte:head>
  <title>t69</title>
  <meta name="description" content="t69" />
</svelte:head>

<!-- Check for a theme and load it (either the default or the space theme) -->
<ThemeManager />

<!-- Setup stacking windows (popover windows with navigation) we use for new conversations, settings, etc -->
<SwinsContainer swins={clientState.layout.swins} />

{@render children?.()}
