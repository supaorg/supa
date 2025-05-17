<script lang="ts">
  import CenteredPage from "$lib/comps/basic/CenteredPage.svelte";
  import SpaceOpener from "./SpaceOpener.svelte";
  import { txtStore } from "$lib/stores/txtStore";

  export let onSpaceSetup: (spaceId: string) => void = () => {};
</script>

<CenteredPage>
  <div class="card p-4 mt-4 space-y-4">
    <h2 class="h2">Let's setup a space</h2>
    <p class="mb-6">{$txtStore.spacesPage.description}</p>
    <SpaceOpener onSpaceSetup={onSpaceSetup} />
  </div>
</CenteredPage>
