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
  import WorkspaceSetup from "./profile-setup/WorkspaceSetup.svelte";
  import TauriWindowSetup from "./TauriWindowSetup.svelte";
  import FsPermissionDenied from "./FsPermissionDenied.svelte";
  import { fsPermissionDeniedStore } from "$lib/stores/fsPermissionDeniedStore";
  import SelectModelModal from "./modals/SelectModelModal.svelte";
  import { extendMarked } from "$lib/utils/markdown/extendMarked";
  import type { Workspace } from "@shared/models";
  import { loadWorkspacesAndConnectToCurrent } from "$lib/stores/workspaceStore";

  type AppState = "initializing" | "needsWorkspace" | "needsSetup" | "ready";

  storeHighlightJs.set(hljs);

  extendMarked();

  let state: AppState = "initializing";

  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
  initializeStores();

  async function onWorkspaceSetup(workspaceId: string) {
    // TODO: implement connecting

    console.error("Not implemented yet");

    state = "ready";
  }

  onMount(async () => {
    state = "initializing";

    console.log("Loading workspaces");

    const workspace = await loadWorkspacesAndConnectToCurrent();

    console.log("Workspace loaded", workspace);

    if (workspace) {
      console.log("Workspace loaded");

      state = "ready";
    } else {
      console.log("No workspace loaded");

      state = "needsWorkspace";
    }
  });

  $: console.log("State", state);

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
