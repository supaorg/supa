<script lang="ts">
  import { onMount } from "svelte";
  import Loading from "$lib/comps/basic/Loading.svelte";
  import TauriWindowSetup from "$lib/comps/tauri/TauriWindowSetup.svelte";
  import { isTauri } from "$lib/tauri/isTauri";
  import { spaceStore } from "$lib/spaces/spaces.svelte";
  import SpaceStoreEffects from "$lib/spaces/SpaceStoreEffects.svelte";
  import SpaceSetup from "$lib/comps/spaces/SpaceSetup.svelte";
  import type { SpaceConnection } from "$lib/spaces/LocalSpaceSync";

  type Status = "initializing" | "needsSpace" | "ready";

  let { children } = $props();
  let status: Status = $state("initializing");
  let currentConnection: SpaceConnection | null = $state(null);

  onMount(() => {
    console.log("Mounting Entry");

    if (!isTauri()) {
      throw new Error(
        "We don't support regular browsers yet. We have to run this from Tauri"
      );
    }

    return () => {
      spaceStore.disconnectAllSpaces();
    };
  });

  async function onSpaceSetup(spaceId: string) {
    // TODO: implement connecting
    console.error("Not implemented yet");
    status = "ready";
  }
</script>


<SpaceStoreEffects
  onSpaceLoad={(hasSpaces) => {
    currentConnection = spaceStore.currentSpaceConnection;
    status = hasSpaces ? "ready" : "needsSpace";
  }}
/>

{#if status === "initializing"}
  <Loading />
{:else if status === "needsSpace"}
  <SpaceSetup {onSpaceSetup} />
{:else if status === "ready"}
  {@render children?.()}
{/if}

{#if isTauri()}
  <TauriWindowSetup />
{/if}
