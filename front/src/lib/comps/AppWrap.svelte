<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import Loading from "$lib/comps/Loading.svelte";
  import {
    Modal,
    getDrawerStore,
    initializeStores,
    type ModalComponent,
  } from "@skeletonlabs/skeleton";
  import { menuDrawerSettings } from "$lib/utils/drawersSettings";
  import Sidebar from "./sidebar/Sidebar.svelte";
  import { getServerInTauri, isTauri } from "$lib/tauri/serverInTauri";
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
  import {
    profileStore,
    loadProfileFromServer,
  } from "$lib/stores/profileStore";
  import { loadAgentsFromServer } from "$lib/stores/agentStore";
  import { storeHighlightJs } from "@skeletonlabs/skeleton";
  // For code highlighting in conversations
  import hljs from "highlight.js";
  import {
    connectToLocalWorkspace,
    getCurrentWorkspace,
    type WorkspacePointer,
  } from "$lib/stores/workspaceStore";
  import WorkspaceSetup from "./profile-setup/WorkspaceSetup.svelte";
  import TauriWindowSetup from "./TauriWindowSetup.svelte";
  import FsPermissionDenied from "./FsPermissionDenied.svelte";
  import { fsPermissionDeniedStore } from "$lib/stores/fsPermissionDeniedStore";
  import SelectModelModal from "./modals/SelectModelModal.svelte";
  import { extendMarked } from "$lib/utils/markdown/extendMarked";
  import type { Workspace } from "@shared/models";

  type AppState = "initializing" | "needsWorkspace" | "needsSetup" | "ready";

  storeHighlightJs.set(hljs);

  extendMarked();

  let state: AppState = "initializing";

  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
  initializeStores();

  // @TODO: get 'setup' from the _workspace.json file
  // Perhaps detect if _workspace.json createdAt is not set - meaning it wasn't setup?

  /*
  Get a list of workspaces stored in the app
  Connect to the workspaces
  If no workspace is found, show the workspace setup screen

  */

  async function onWorkspaceSetup(workspace: Workspace) {
    await loadStoresFromServer();
    state = "ready";
  }

  $: {
    /*
    if (
      state === "ready" &&
      ($profileStore === null || !$profileStore?.setup)
    ) {
      state = "needsSetup";
    }

    if (
      state === "needsSetup" &&
      $profileStore !== null &&
      $profileStore.setup
    ) {
      state = "ready";
    }
    */
  }

  async function loadStoresFromServer() {
    return Promise.all([
      loadProfileFromServer(),
      loadThreadsFromServer(),
      loadAgentsFromServer(),
    ]);
  }

  onMount(async () => {
    const workspacePointer = getCurrentWorkspace();

    /*
    if (workspacePointer && workspacePointer.type) {
      if (workspacePointer.type === "local") {
        await connectToLocalWorkspace(workspacePointer as WorkspacePointer);
      } else if (workspacePointer.type === "remote") {
        throw new Error("Remote workspace is not implemented yet");
      }
    } else {
      await connectToLocalWorkspace();
    }
    */

    if (!workspacePointer) {
      state = "needsWorkspace";
    } else {
      await connectToLocalWorkspace(workspacePointer as WorkspacePointer);

      await loadStoresFromServer();

      if (workspacePointer.workspace.setup === false) {
        state = "needsSetup";
      } else {
        state = "ready";
      }
    }
  });

  onDestroy(async () => {
    await getServerInTauri()?.kill();
  });

  let drawer = getDrawerStore();

  function menuOpen() {
    drawer.open(menuDrawerSettings);
  }

  const modalRegistry: Record<string, ModalComponent> = {
    newThread: { ref: NewThreadModal },
    selectModel: { ref: SelectModelModal },
  };
</script>

<Modal components={modalRegistry} />

{#if $fsPermissionDeniedStore}
  <FsPermissionDenied />
{:else if state === "initializing"}
  <Loading />
{:else if state === "needsWorkspace"}
  <WorkspaceSetup {onWorkspaceSetup} />
{:else if state === "needsSetup"}
  <SetupWizard />
{:else if state === "ready"}
  <div class="flex h-screen overflow-hidden">
    <aside
      class="relative w-[260px] flex-shrink-0 overflow-y-auto border-r border-surface-300-600-token"
    >
      <Sidebar />
    </aside>
    <main class="relative flex-grow h-full overflow-y-auto page-bg">
      <slot />
    </main>
  </div>
{/if}

{#if isTauri()}
  <TauriWindowSetup />
{/if}
