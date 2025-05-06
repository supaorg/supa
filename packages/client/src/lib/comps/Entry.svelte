<script lang="ts">
  import { onMount } from "svelte";
  import Loading from "$lib/comps/basic/Loading.svelte";
  import TauriWindowSetup from "$lib/comps/tauri/TauriWindowSetup.svelte";
  import { isTauri } from "$lib/tauri/isTauri";
  import { spaceStore } from "$lib/spaces/spaces.svelte";
  import SpaceSetup from "$lib/comps/spaces/SpaceSetup.svelte";
  import type { SpaceConnection } from "$lib/spaces/LocalSpaceSync";
  import { initializeDatabase, savePointers, saveCurrentSpaceId, saveConfig } from "$lib/localDb";
  import { setupTtabs } from "$lib/ttabs/ttabsLayout";

  type Status = "initializing" | "needsSpace" | "ready";

  let { children } = $props();
  let status: Status = $state("initializing");
  let currentConnection: SpaceConnection | null = $state(null);
  let initialized = $state(false);

  onMount(() => {
    console.log("Mounting Entry");

    if (!isTauri()) {
      throw new Error(
        "We don't support regular browsers yet. We have to run this from Tauri"
      );
    }

    // Initialize space data
    initializeSpaceData();

    // Return cleanup function
    return () => {
      spaceStore.disconnectAllSpaces();
    };
  });

  // Separate async function for initializing space data
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
      
      await spaceStore.loadSpacesAndConnectToCurrent();

      setupTtabs();
      
      initialized = true;
      
      // Update application state based on space availability
      currentConnection = spaceStore.currentSpaceConnection;
      
      // Only change status after loading is complete
      status = currentConnection ? "ready" : "needsSpace";
      console.log("Entry: space loaded", currentConnection, "status:", status);
    } catch (error) {
      console.error('Failed to initialize space state from database:', error);
      // Keep initializing state on error? Or maybe add an error state?
    }
  }

  // Effects for persisting state changes
  $effect(() => {
    if (initialized) {
      savePointers(spaceStore.pointers);
    }
  });

  $effect(() => {
    if (initialized && spaceStore.currentSpaceId !== null) {
      saveCurrentSpaceId(spaceStore.currentSpaceId);
    }
  });

  $effect(() => {
    if (initialized) {
      saveConfig(spaceStore.config);
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
