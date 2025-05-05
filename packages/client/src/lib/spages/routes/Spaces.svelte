<script lang="ts">
  import SpaceOpener from "$lib/comps/spaces/SpaceOpener.svelte";
  import { goto } from "$app/navigation";
  import CenteredPage from "$lib/comps/basic/CenteredPage.svelte";
  import SpaceList from "$lib/comps/spaces/SpaceList.svelte";
  import { txtStore } from "$lib/stores/txtStore";

  function handleSpaceSetup(spaceId: string) {
    goto(`/`);
  }
</script>

<h3 class="h3 pb-4">{$txtStore.spacesPage.title}</h3>
<p class="mb-6">
  {$txtStore.spacesPage.description}
</p>
<SpaceList />
<SpaceOpener onSpaceSetup={handleSpaceSetup} />
