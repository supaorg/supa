<script lang="ts">
  import { loadSpaceTheme } from "$lib/stores/theme.svelte";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";

  // @TODO: how about we use it outside of Space and have logic that 
  // first checks for a default theme (outside of space) and then a space theme 
  // if space is loaded

  $effect(() => {
    console.log("Load space theme");
    const currentSpaceId = spaceStore.currentSpaceId;
    if (currentSpaceId) {
      loadSpaceTheme();
    }
  });
</script>
