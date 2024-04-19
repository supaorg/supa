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
  import "highlight.js/styles/github-dark.css";
  import { getCurrentWorkspace } from "$lib/stores/workspaceStore";
    import WorkspaceSetup from "./profile-setup/WorkspaceSetup.svelte";

  type AppState = "initializing" | "needsWorkspace" | "needsSetup" | "ready";

  storeHighlightJs.set(hljs);

  let state: AppState = "initializing";

  let tauriIntegration: ServerInTauri | null = null;
  let serverUrl = "http://localhost:6969";
  let serverWsUrl = "ws://localhost:6969";

  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
  initializeStores();

  $: {
    if ($profileStore === null && getCurrentWorkspace() !== null) {
      state = "needsSetup";
    }
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

    const workspace = getCurrentWorkspace();

    if (workspace) {
      await client.post("workspace", workspace.uri);

      await Promise.all([
        loadProfileFromServer(),
        loadThreadsFromServer(),
        loadAgentsFromServer(),
      ]);

      if ($profileStore === null) {
        state = "needsSetup";
      } else {
        state = "ready";
      }
    } else {
      state = "needsWorkspace";
    }

    //await client.post('workspace', '/Users/dk/Library/Mobile Documents/com~apple~CloudDocs/test-supamind');
    //await client.post('workspace', 'data-dev');
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

{#if state === "initializing"}
  <Loading />
{:else if state === "needsWorkspace"}
  <WorkspaceSetup />
{:else if state === "needsSetup"}
  <SetupWizard />
{:else if state === "ready"}
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
{/if}
