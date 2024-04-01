<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import Loading from "$lib/comps/Loading.svelte";
  import {
    AppBar,
    AppShell,
    Modal,
    getDrawerStore,
    initializeStores,
    type ModalComponent,
  } from "@skeletonlabs/skeleton";
  import { menuDrawerSettings } from "$lib/utils/drawersSettings";
  import Sidebar from "./sidebar/Sidebar.svelte";
  import { ServerInTauri, isTauri } from "$lib/tauri/serverInTauri";
  import { client } from "$lib/tools/client";
  import NewThreadModal from "./modals/NewThreadModal.svelte";
  import { loadThreadsFromServer } from "$lib/stores/threads";
  import { storePopup } from "@skeletonlabs/skeleton";
  import {
    computePosition,
    autoUpdate,
    flip,
    shift,
    offset,
    arrow,
  } from "@floating-ui/dom";
    import SetupWizard from "./profile-setup/SetupWizard.svelte";
    import { profileStore, loadProfileFromServer } from "$lib/stores/profile";

  let tauriIntegration: ServerInTauri | null = null;
  let serverUrl = "http://localhost:6969";
  let serverWsUrl = "ws://localhost:6969";
  let webSocketEndpoint = import.meta.env.VITE_WEBSOCKET_ENDPOINT;
  let initialized = false;
  let needsSetup = false;

  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
  initializeStores();

  $: {
    needsSetup = $profileStore === null;
  }

  onMount(async () => {
    if (isTauri()) {
      tauriIntegration = new ServerInTauri();
      await tauriIntegration.init();
      //serverUrl = tauriIntegration.getUrl();

      webSocketEndpoint = `ws://localhost:${tauriIntegration.port}/ws`;
    }

    if (client.getURL() !== serverUrl) {
      client.setUrl(serverWsUrl);
    }

    // Let's load stuff from the server to stores here
    loadProfileFromServer();
    loadThreadsFromServer();

    initialized = true;
  });

  onDestroy(async () => {
    await tauriIntegration?.kill();
  });

  let drawer = getDrawerStore();

  function menuOpen() {
    drawer.open(menuDrawerSettings);
  }

  const modalRegistry: Record<string, ModalComponent> = {
    newThread: { ref: NewThreadModal },
  };
</script>

<Modal components={modalRegistry} />

{#if initialized}
  {#if !needsSetup}
  <AppShell>
    <svelte:fragment slot="header">
    </svelte:fragment>
    <svelte:fragment slot="sidebarLeft">
      <div class="hidden md:block" style="width: 260px;"><Sidebar /></div>
    </svelte:fragment>
    <slot />
  </AppShell>
  {:else}
    <SetupWizard />
  {/if}
{:else}
  <Loading />
{/if}