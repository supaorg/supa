<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Loading from "$lib/comps/basic/Loading.svelte";
  import TauriWindowSetup from "$lib/comps/tauri/TauriWindowSetup.svelte";
  import { isTauri } from "$lib/tauri/isTauri";
  import { loadSpacesAndConnectToCurrent } from "$lib/spaces/spaceStore";
  import SpaceSetup from "$lib/comps/spaces/SpaceSetup.svelte";
  import { page } from "$app/state";
  import { setLastPageUrlInSpace } from "$lib/spaces/spaceStore";
  import type { SpaceConnection } from "$lib/spaces/LocalSpaceSync";

  type Status = "initializing" | "needsSpace" | "ready";

  let { children } = $props();
  let status: Status = $state("initializing");
  let currentConnection: SpaceConnection | null = $state(null);

  $effect(() => {
    // @TODO: no need to with ttabs
    setLastPageUrlInSpace(page.url.pathname + page.url.search);
  });

  onMount(() => {
    console.log("Mounting Entry");

    const initializeApp = async () => {
      if (!isTauri()) {
        throw new Error(
          "We don't support regular browsers yet. We have to run this from Tauri",
        );
      }

      currentConnection = await loadSpacesAndConnectToCurrent();

      if (currentConnection) {
        status = "ready";
      } else {
        status = "needsSpace";
      }
    };

    initializeApp();

    return () => {
      if (currentConnection && currentConnection.connected) {
        currentConnection.disconnect();
      }
    };
  });

  async function onSpaceSetup(spaceId: string) {
    // TODO: implement connecting
    console.error("Not implemented yet");
    status = "ready";
  }
</script>

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
