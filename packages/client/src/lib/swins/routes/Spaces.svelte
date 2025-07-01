<script lang="ts">
  import SpaceList from "$lib/comps/spaces/SpaceList.svelte";
  import { txtStore } from "$lib/stores/txtStore";
  import { clientState } from "$lib/clientState.svelte";
  import { Plus } from "lucide-svelte";

  async function handleNewSpace() {
    await clientState.createNewSpace('local');
    clientState.layout.swins.clear();
  }
</script>

<div class="flex justify-between items-center pb-4">
  <h3 class="h3">{$txtStore.spacesPage.title}</h3>
  <button class="btn preset-filled-primary-500" onclick={handleNewSpace}>
    <Plus size={16} />
    New Space
  </button>
</div>
<p class="mb-6">
  {$txtStore.spacesPage.description}
</p>
<SpaceList />
