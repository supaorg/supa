<script lang="ts">
  import SpaceList from "$lib/comps/spaces/SpaceList.svelte";
  import { txtStore } from "$lib/stores/txtStore";
  import { createNewInBrowserSpaceSync } from "$lib/spaces/InBrowserSpaceSync";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";

  async function handleNewSpace() {
    const sync = await createNewInBrowserSpaceSync();
    spaceStore.addLocalSpace(sync, "browser://" + sync.space.getId());
    spaceStore.currentSpaceId = sync.space.getId();
  }
</script>

<div class="flex justify-between items-center">
  <h3 class="h3">{$txtStore.spacesPage.title}</h3>
  <button class="btn preset-filled-primary-500" onclick={handleNewSpace}>
    + New Space
  </button>
</div>
<p class="mb-6">
  {$txtStore.spacesPage.description}
</p>
<SpaceList />
