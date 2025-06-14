<script lang="ts">
  import { loadSpaceTheme } from "$lib/stores/theme.svelte";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
    import { onMount } from "svelte";

  // @TODO: how about we use it outside of Space and have logic that 
  // first checks for a default theme (outside of space) and then a space theme 
  // if space is loaded

  onMount(() => {
    loadSpaceTheme();
  });

  $effect(() => {
    const currentSpaceId = spaceStore.currentSpaceId;
    if (currentSpaceId) {
      loadSpaceTheme();
    }
  });
</script>
