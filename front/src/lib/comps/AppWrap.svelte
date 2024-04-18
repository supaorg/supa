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
  import { loadAgentsFromServer } from "$lib/stores/agentStore";
  import { storeHighlightJs } from "@skeletonlabs/skeleton";
  // For code highlighting in conversations
  import hljs from "highlight.js";
  import 'highlight.js/styles/github-dark.css';

  storeHighlightJs.set(hljs);

  let tauriIntegration: ServerInTauri | null = null;
  let serverUrl = "http://localhost:6969";
  let serverWsUrl = "ws://localhost:6969";
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

      serverUrl = tauriIntegration.getHttpUrl();
      serverWsUrl = tauriIntegration.getWebSocketUrl();
    }

    if (client.getURL() !== serverUrl) {
      client.setUrl(serverWsUrl);
    }

    await client.post('workspace', 'data-dev');

    await Promise.all([
      loadProfileFromServer(),
      loadThreadsFromServer(),
      loadAgentsFromServer()
    ]);

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
      <svelte:fragment slot="header"></svelte:fragment>
      <svelte:fragment slot="sidebarLeft">
        <div
          class="hidden md:block h-full light:bg-surface-100 dark:bg-surface-900-token border-r dark:border-surface-500/30"
          style="width: 260px;"
        >
          <Sidebar />
        </div>
      </svelte:fragment>
      <slot />
    </AppShell>
  {:else}
    <SetupWizard />
  {/if}
{:else}
  <Loading />
{/if}
