<script lang="ts">
  import SpaceOpener from "$lib/comps/spaces/SpaceOpener.svelte";
  import { goto } from "$app/navigation";
  import CenteredPage from "$lib/comps/basic/CenteredPage.svelte";
  import SpaceList from "$lib/comps/spaces/SpaceList.svelte";

  function handleSpaceSetup(spaceId: string) {
    goto(`/`);
  }
</script>

<CenteredPage>
  <h2 class="h2">Your Spaces</h2>
  <p class="mb-6">
    A space is where your AI apps and other data is stored. You can have
    multiple spaces and switch between them. For example, one can be for work
    and another personal.
  </p>
  <SpaceList />
  <SpaceOpener onSpaceSetup={handleSpaceSetup} />
</CenteredPage>
