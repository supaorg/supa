<script lang="ts">
  import { clientState } from "@supa/client/state/clientState.svelte";
  import SpaceOpener from "./SpaceOpener.svelte";

  function handleOpen(spaceId?: string) {
    clientState.layout.swins.clear();
  }
</script>

<div class="flex justify-between items-center pb-4">
  <h3 class="h3">Create or open your workspace</h3>
</div>
<p class="mb-6">You can create a new workspace or open an existing one.</p>

<SpaceOpener onSpaceSetup={handleOpen} />
