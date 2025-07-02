<script lang="ts">
  import { clientState } from "$lib/state/clientState.svelte";
  import { onMount } from "svelte";

  // @TODO: how about we use it outside of Space and have logic that 
  // first checks for a default theme (outside of space) and then a space theme 
  // if space is loaded

  onMount(() => {
    clientState.theme.loadSpaceTheme();
  });

  $effect(() => {
    	const currentSpaceId = clientState.spaces.currentSpaceId;
    if (currentSpaceId) {
      clientState.theme.loadSpaceTheme();
    }
  });
</script>
