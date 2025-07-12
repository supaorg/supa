<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { isTauri } from "$lib/tauri/isTauri";
  import { clientState } from "$lib/state/clientState.svelte";
  import Loading from "$lib/comps/basic/Loading.svelte";
  import FreshStartWizard from "$lib/comps/wizards/FreshStartWizard.svelte";
  import Space from "./apps/Space.svelte";
  import TauriUpdater from "./tauri/TauriUpdater.svelte";
  import TauriWindowSetup from "./tauri/TauriWindowSetup.svelte";

  onMount(async () => {
    // Single method call - all initialization handled internally
    await clientState.initializeWithDatabase();
  });

  onDestroy(() => {
    clientState.cleanup();
  });
</script>

{#if clientState.isInitializing || clientState.spaceStatus === "loading"}
  <Loading />
{:else if clientState.needsSpace}
  <FreshStartWizard />
{:else if clientState.isReady}
  {#if clientState.currentSpaceState}
    <Space spaceState={clientState.currentSpaceState} />
  {:else}
    <div class="p-4 text-red-500">
      <h2>A space didn't load correctly</h2>
    </div>
  {/if}
{:else if clientState.initializationError}
  <div class="p-4 text-red-500">
    <h2>Initialization Error</h2>
    <p>{clientState.initializationError}</p>
  </div>
{/if}

{#if isTauri()}
  <!-- Save and load the window size and position -->
  <!--<TauriWindowSetup />-->

  <!-- Check for a new version of the app -->
  <TauriUpdater />
{/if}
