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
  import { loadThreadsFromServer } from "$lib/stores/threadStore";
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
  import {
    getCurrentWorkspace,
    setCurrentWorkspace,
    type WorkspaceInfo,
  } from "$lib/stores/workspaceStore";
  import WorkspaceSetup from "./profile-setup/WorkspaceSetup.svelte";
  import TauriWindowSetup from "./TauriWindowSetup.svelte";
  import FsPermissionDenied from "./FsPermissionDenied.svelte";
  import { fsPermissionDeniedStore, subscribeToSession } from "$lib/stores/fsPermissionDeniedStore";
    import SelectModelModal from "./modals/SelectModelModal.svelte";
    import { routes } from "@shared/routes/routes";

  type AppState =
    | "initializing"
    | "needsWorkspace"
    | "needsSetup"
    | "ready";

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

    if (
      $profileStore !== null &&
      $profileStore?.name &&
      getCurrentWorkspace() !== null
    ) {
      state = "ready";
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

    console.log("Server URL:", serverUrl);

    await subscribeToSession();

    const workspace = getCurrentWorkspace();
    let workspaceExists = false;

    if (workspace) {
      const workspaceExistsRes = await client.post(
        routes.workspaceExists,
        workspace?.uri,
      );

      if (!workspaceExistsRes.error) {
        workspaceExists = workspaceExistsRes.data as boolean;
      } else {
        console.error(workspaceExistsRes.error);
        fsPermissionDeniedStore.set(true);
        return;
      }
    }

    if (workspaceExists) {
      await client.post(routes.workspace, workspace?.uri);

      console.log("Workspace:", workspace?.uri);

      await loadStoresFromServer();

      if ($profileStore === null || !$profileStore?.setup) {
        state = "needsSetup";
      } else {
        state = "ready";
      }
    } else {
      const newWorkspaceRes = await client.post(routes.newWorkspace);

      if (newWorkspaceRes.error) {
        console.error(newWorkspaceRes.error);
        fsPermissionDeniedStore.set(true);
        return;
      }

      const workspaceDir = newWorkspaceRes.data as string;

      console.log("Workspace:", workspaceDir);

      const newWorkspace = {
        uri: workspaceDir,
      } as WorkspaceInfo;

      setCurrentWorkspace(newWorkspace);

      // Doing it in case if the folder contains some files already
      await loadStoresFromServer();
      if ($profileStore === null || !$profileStore?.setup) {
        state = "needsSetup";
      } else {
        state = "ready";
      }
    }
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
    selectModel: { ref: SelectModelModal }
  };

</script>

<Modal components={modalRegistry} />

{#if $fsPermissionDeniedStore}
  <FsPermissionDenied />
{:else if state === "initializing"}
  <Loading />
{:else if state === "needsWorkspace"}
  <WorkspaceSetup />
{:else if state === "needsSetup"}
  <SetupWizard />
{:else if state === "ready"}
  <AppShell>
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

{#if isTauri()}
  <TauriWindowSetup />
{/if}
