<script lang="ts">
  import { onMount } from "svelte";
  import Loading from "$lib/comps/basic/Loading.svelte";
  import TauriWindowSetup from "$lib/comps/tauri/TauriWindowSetup.svelte";
  import { isTauri } from "$lib/tauri/isTauri";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import SpaceSetup from "$lib/comps/spaces/SpaceSetup.svelte";
  import { initializeDatabase, savePointers, saveCurrentSpaceId, saveConfig } from "$lib/localDb";
  import TauriUpdater from "./TauriUpdater.svelte";

  type Status = "initializing" | "needsSpace" | "ready";

  let { children } = $props();
  let status: Status = $state("initializing");

  onMount(() => {
    if (!isTauri()) {
      throw new Error(
        "We don't support regular browsers yet. We have to run this from Tauri"
      );
    }

    initializeSpaceData();

    return () => {
      spaceStore.disconnectAllSpaces();
    };
  });

  async function initializeSpaceData() {
    try {
      // Explicitly set status to initializing (already the default, but making it explicit)
      status = "initializing";
      
      // Initialize data from database
      const { pointers, currentSpaceId, config } = await initializeDatabase();
      
      // Set initial state to the spaceStore
      spaceStore.setInitialState({
        pointers,
        currentSpaceId,
        config
      });
      
      const connection = await spaceStore.loadSpacesAndConnectToCurrent();
      
      // Only change status after loading is complete
      status = connection ? "ready" : "needsSpace";
    } catch (error) {
      console.error('Failed to initialize space state from database:', error);
      // Keep initializing state on error? Or maybe add an error state?
    }
  }

  // Effects for persisting state changes
  $effect(() => {
    if (status === "ready") {
      savePointers(spaceStore.pointers);
    }
  });

  $effect(() => {
    if (status === "ready" && spaceStore.currentSpaceId !== null) {
      saveCurrentSpaceId(spaceStore.currentSpaceId);
    }
  });

  $effect(() => {
    if (status === "ready") {
      saveConfig(spaceStore.config);
    }
  });
  
  // Track the number of spaces and switch to setup state when there are none
  $effect(() => {
    // Only check when we're in ready state and have access to the pointers
    if (status === "ready" && spaceStore.pointers.length === 0) {
      console.log("No spaces left, switching to setup state");
      status = "needsSpace";
    }
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

<TauriUpdater />
