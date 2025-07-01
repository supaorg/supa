<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import Loading from "$lib/comps/basic/Loading.svelte";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import { authStore } from "$lib/stores/auth.svelte";
  import FreshStartWizard from "$lib/comps/wizards/FreshStartWizard.svelte";
  import {
    initializeDatabase,
    savePointers,
    saveCurrentSpaceId,
    saveConfig,
  } from "$lib/localDb";
  import Space from "./apps/Space.svelte";
  import { spaceSocketStore } from "$lib/stores/spacesocket.svelte";

  type Status = "initializing" | "needsSpace" | "ready";

  let status: Status = $state("initializing");

  onMount(async () => {
    // Check auth first
    await authStore.checkAuth();

    // Initialize space data regardless of auth status
    await initializeSpaceData();
  });

  $effect(() => {
    if (authStore.isAuthenticated) {
      spaceSocketStore.setupSocketConnection();
    } else {
      spaceSocketStore.cleanupSocketConnection();
    }
  });

  $effect(() => {
    if (status === "ready" && spaceStore.pointers.length === 0) {
      status = "needsSpace";
    }

    console.log(status, spaceStore.pointers.length);

    if (status === "needsSpace" && spaceStore.pointers.length > 0) {
      if (!spaceStore.currentSpaceId) {
        spaceStore.currentSpaceId = spaceStore.pointers[0].id;
      }

      status = "ready";
    }
  });

  onDestroy(() => {
    spaceStore.disconnectAllSpaces();
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
        config,
      });

      // Filter spaces for the current user (if authenticated)
      await spaceStore.filterSpacesForCurrentUser();

      const connection = await spaceStore.loadSpacesAndConnectToCurrent();

      // Only change status after loading is complete
      status = connection ? "ready" : "needsSpace";
    } catch (error) {
      console.error("Failed to initialize space state from database:", error);
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
    if (status === "ready") {
      saveConfig(spaceStore.config);
    }
  });

  $effect(() => {
    // Only check when we're in ready state and have access to the pointers
    if (status === "ready" && spaceStore.pointers.length === 0) {
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
