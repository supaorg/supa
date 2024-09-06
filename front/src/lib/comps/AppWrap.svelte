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
  import { storeHighlightJs } from "@skeletonlabs/skeleton";
  // For code highlighting in conversations
  import hljs from "highlight.js";
  import {
    currentWorkspacePointerStore,
    connectToWorkspace,
    type WorkspacePointer,
  } from "$lib/stores/workspaceStore";
  import WorkspaceSetup from "./profile-setup/WorkspaceSetup.svelte";
  import TauriWindowSetup from "./TauriWindowSetup.svelte";
  import FsPermissionDenied from "./FsPermissionDenied.svelte";
  import { fsPermissionDeniedStore } from "$lib/stores/fsPermissionDeniedStore";
  import SelectModelModal from "./modals/SelectModelModal.svelte";
  import { extendMarked } from "$lib/utils/markdown/extendMarked";
  import type { Workspace } from "@shared/models";
  import loadStoresFromServer from "$lib/stores/loadStoresFromServer";
    import { get } from "svelte/store";
    import { loadWorkspacesAndConnect } from "$lib/stores/workspacePointerStore";

  type AppState = "initializing" | "needsWorkspace" | "needsSetup" | "ready";

  storeHighlightJs.set(hljs);

  extendMarked();

  let state: AppState = "initializing";

  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
  initializeStores();

  async function onWorkspaceSetup(workspace: Workspace) {
    // TODO: implement connecting

    console.error("Not implemented yet", workspace);

    state = "ready";
  }

  let currentWorkspace: WorkspacePointer | null = null;

  onMount(async () => {
    const workspacePointer = $currentWorkspacePointerStore;

    currentWorkspace = workspacePointer;

    state = "initializing";

    if (!workspacePointer) {
      state = "needsWorkspace";
    } else {
      const workspace = await loadWorkspacesAndConnect();

      if (workspace) {
        state = "ready";
      } else {
        console.error("Could not connect to workspace");
      }

      /*
      await connectToLocalWorkspace(workspacePointer as WorkspacePointer);
      await loadStoresFromServer();

      if (workspacePointer.workspace.setup === false) {
        state = "needsSetup";
      } else {
        state = "ready";
      }
      */
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
