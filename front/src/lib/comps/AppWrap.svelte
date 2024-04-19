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
  import {
    getCurrentWorkspace,
    setCurrentWorkspace,
    type WorkspaceInfo,
  } from "$lib/stores/workspaceStore";
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

  async function loadStoresFromServer() {
    return Promise.all([
      loadProfileFromServer(),
      loadThreadsFromServer(),
      loadAgentsFromServer(),
    ]);
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

    // @TODO: check if the workspace exists.
    const workspaceExists = workspace
      ? await client
          .post("workspace-exists", workspace.uri)
          .then((res) => res.data as boolean)
      : false;

    if (workspaceExists) {
      await client.post("workspace", workspace?.uri);

      console.log("Workspace:", workspace);

      await loadStoresFromServer();

      if ($profileStore === null) {
        state = "needsSetup";
      } else {
        state = "ready";
      }
    } else {
      // @TODO: check for a workspace in iCloud or Documents (search for Supamind directory). Create a workspace automatically if none is found in iCloud or Documents.
      // @TODO: Use 'Supamind/workspace'

      const newWorkspaceRes = await client.post("new-workspace");

      if (newWorkspaceRes.error) {
        console.error(newWorkspaceRes.error);

        // @TODO: Handle error or permission denied. Show a message to a user that we need it to create a workspace.

        return;
      }

      const workspaceDir = newWorkspaceRes.data as string;

      const newWorkspace = {
        uri: workspaceDir,
      } as WorkspaceInfo;

      setCurrentWorkspace(newWorkspace);

      await loadStoresFromServer();

      console.log("New workspace created:", newWorkspace);

      state = "ready";
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
