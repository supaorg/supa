<script lang="ts">
  import SpaceList from "$lib/comps/spaces/SpaceList.svelte";
  import { txtStore } from "$lib/stores/txtStore";

  function handleNewSpace() {
    // TODO: Implement new space creation
  }
</script>

<div class="flex justify-between items-center pb-4">
  <h3 class="h3">{$txtStore.spacesPage.title}</h3>
  <button class="btn preset-filled" onclick={handleNewSpace}>
    New Space
  </button>
</div>
<p class="mb-6">
  {$txtStore.spacesPage.description}
</p>
<SpaceList />
