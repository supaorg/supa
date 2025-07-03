<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import Loading from "$lib/comps/basic/Loading.svelte";
  import { clientState } from "$lib/state/clientState.svelte";
  import FreshStartWizard from "$lib/comps/wizards/FreshStartWizard.svelte";
  import { initializeDatabase, savePointers, saveConfig } from "$lib/localDb";
  import Space from "./apps/Space.svelte";

  type Status = "initializing" | "needsSpace" | "ready";

  let status: Status = $state("initializing");

  onMount(async () => {
    // Initialize the entire client state system
    await clientState.initialize();

    // Initialize space data regardless of auth status
    await initializeSpaceData();
  });

  $effect(() => {
    if (status === "ready" && clientState.spaces.pointers.length === 0) {
      status = "needsSpace";
    }

    console.log(status, clientState.spaces.pointers.length);

    if (status === "needsSpace" && clientState.spaces.pointers.length > 0) {
      if (!clientState.spaces.currentSpaceId) {
        clientState.spaces.currentSpaceId = clientState.spaces.pointers[0].id;
      }

      status = "ready";
    }
  });

  onDestroy(() => {
    clientState.cleanup();
  });

  async function initializeSpaceData() {
    try {
      // Explicitly set status to initializing (already the default, but making it explicit)
      status = "initializing";

      // Initialize data from database
      const { pointers, currentSpaceId, config } = await initializeDatabase();

      // Set initial state to the spaces
      clientState.spaces.setInitialState({
        pointers,
        currentSpaceId,
        config,
      });

      // Filter spaces for the current user (if authenticated)
      await clientState.spaces.filterSpacesForCurrentUser();

      // With lazy loading, we don't need to preload all spaces
      // Just set status based on whether we have pointers
      status = clientState.spaces.pointers.length > 0 ? "ready" : "needsSpace";
    } catch (error) {
      console.error("Failed to initialize space state from database:", error);
      // Keep initializing state on error? Or maybe add an error state?
    }
  }

  // Effects for persisting state changes
  $effect(() => {
    if (status === "ready") {
      savePointers(clientState.spaces.pointers);
    }
  });

  $effect(() => {
    if (status === "ready") {
      saveConfig(clientState.spaces.config);
    }
  });

  $effect(() => {
    // Only check when we're in ready state and have access to the pointers
    if (status === "ready" && clientState.spaces.pointers.length === 0) {
      console.log("No spaces left, switching to setup state");
      status = "needsSpace";
    }
  });

  async function onSpaceSetup(spaceId: string) {
    status = "ready";
  }
</script>

{#if status === "initializing"}
  <Loading />
{:else if status === "needsSpace"}
  <FreshStartWizard />
{:else if status === "ready"}
  <Space />
{/if}
