<script lang="ts">
  import "../app.css";
  import ThemeManager from "$lib/comps/themes/ThemeManager.svelte";
  import { swins } from "$lib/swins";
  import SwinsContainer from "$lib/swins/SwinsContainer.svelte";
  import { onMount } from "svelte";
  import { destroyShortcuts, initShortcuts } from "$lib/shortcuts/shortcuts";

  let { children } = $props();

  onMount(() => {
    initShortcuts();

    return () => {
      destroyShortcuts();
    };
  });
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
