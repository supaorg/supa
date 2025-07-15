<script lang="ts">
  import "@supa/client/style.css";
  import ThemeManager from "@supa/client/comps/themes/ThemeManager.svelte";
  import { clientState } from "@supa/client/state/clientState.svelte";
  import SwinsContainer from "@supa/client/swins/SwinsContainer.svelte";
  import { onMount } from "svelte";
  import { destroyShortcuts, initShortcuts } from "@supa/client/shortcuts/shortcuts";

  import { fetchSpaces } from "@supa/client/utils/api";

  let { children } = $props();

  onMount(() => {
    initShortcuts();

    return () => {
      destroyShortcuts();
    };
  });

  $effect(() => {
    // Fetch spaces when authenticated
    if (clientState.auth.isAuthenticated) {
      fetchSpaces();
    }
  });
</script>

<svelte:head>
  <title>Supa</title>
  <meta name="description" content="Supa" />
</svelte:head>

<!-- Check for a theme and load it (either the default or the space theme) -->
<ThemeManager />

<!-- Setup stacking windows (popover windows with navigation) we use for new conversations, settings, etc -->
<SwinsContainer swins={clientState.layout.swins} />

{@render children?.()}
