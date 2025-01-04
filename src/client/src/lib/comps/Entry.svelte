<script lang="ts">
  // Floating UI for Popups
  import {
    computePosition,
    autoUpdate,
    flip,
    shift,
    offset,
    arrow,
  } from "@floating-ui/dom";

  /*
  import { storePopup } from "@skeletonlabs/skeleton";
  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
  */

  import { onMount } from "svelte";
  import Loading from "$lib/comps/basic/Loading.svelte";
  import TauriWindowSetup from "$lib/comps/tauri/TauriWindowSetup.svelte";
  import { isTauri } from "$lib/tauri/isTauri";
  import { loadSpacesAndConnectToCurrent } from "$lib/spaces/spaceStore";
  import SpaceSetup from "$lib/comps/setup/SpaceSetup.svelte";

  type State = "initializing" | "needsSpace" | "ready";

  let state: State = $state("initializing");

  let { children } = $props();

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
