<script lang="ts">
  import SpaceList from "@supa/client/comps/spaces/SpaceList.svelte";
  import { txtStore } from "@supa/client/state/txtStore";
  import { clientState } from "@supa/client/state/clientState.svelte";
  import { Plus } from "lucide-svelte";
  import SwinsNavButton from "../SwinsNavButton.svelte";

  /*
  async function handleNewSpace() {
    await clientState.createNewSpace('local');
    clientState.layout.swins.clear();
  }
  */
</script>

<div class="flex justify-between items-center pb-4">
  <h3 class="h3">{$txtStore.spacesPage.title}</h3>
  <SwinsNavButton
    className="btn preset-filled-primary-500"
    component="open-space"
    title="Add a workspace"
  >
    <Plus size={16} />
    Add a workspace
  </SwinsNavButton>
</div>
<p class="mb-6">
  {$txtStore.spacesPage.description}
</p>
<SpaceList />
