<script lang="ts">
  import { onMount } from "svelte";
  import Loading from "$lib/comps/basic/Loading.svelte";
  import TauriWindowSetup from "$lib/comps/tauri/TauriWindowSetup.svelte";
  import { isTauri } from "$lib/tauri/isTauri";
  import { loadSpacesAndConnectToCurrent } from "$lib/spaces/spaceStore";
  import SpaceSetup from "$lib/comps/spaces/SpaceSetup.svelte";
  import { page } from "$app/state";
  import { setLastPageUrlInSpace } from "$lib/spaces/spaceStore";

  type State = "initializing" | "needsSpace" | "ready";

  let { children } = $props();
  let state: State = $state("initializing");

  $effect(() => {
    setLastPageUrlInSpace(page.url.pathname + page.url.search);
  });

  onMount(async () => {
    if (!isTauri()) {
      throw new Error(
        "We don't support regular browsers yet. We have to run this from Tauri",
      );
    }

    const space = await loadSpacesAndConnectToCurrent();

    if (space) {
      state = "ready";
    } else {
      state = "needsSpace";
    }
  });

  async function onSpaceSetup(spaceId: string) {
    // TODO: implement connecting

    console.error("Not implemented yet");

    state = "ready";
  }
</script>

{#if state === "initializing"}
  <Loading />
{:else if state === "needsSpace"}
  <SpaceSetup {onSpaceSetup} />
{:else if state === "ready"}
  {@render children?.()}
{/if}

{#if isTauri()}
  <TauriWindowSetup />
{/if}
