<script lang="ts">
  import { loadSpaceTheme } from "$lib/stores/theme.svelte";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";

  $effect(() => {
    console.log("Load space theme")
    const currentSpaceId = spaceStore.currentSpaceId;
    if (currentSpaceId) {
      loadSpaceTheme();
    }
  });
</script>
