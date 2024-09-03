<script lang="ts">
  import type { PopupSettings } from "@skeletonlabs/skeleton";
  import { popup } from "@skeletonlabs/skeleton";
  import { Icon, ChevronUpDown } from "svelte-hero-icons";
  import {
    workspacePointersStore,
    currentWorkspacePointerStore,
    type WorkspacePointer,
    setCurrentWorkspace,
  } from "$lib/stores/workspaceStore";
  import loadStoresFromServer from "$lib/stores/loadStoresFromServer";

  const popupClick: PopupSettings = {
    event: "click",
    target: "workspace-selector-popup",
    placement: "bottom",
  };

  // Have a type: id + name
  type WorkspaceInSelector = {
    id: string;
    name: string;
  };

  let workspacesInSelector: WorkspaceInSelector[] = [];
  let currentWorkspace: WorkspaceInSelector | null = null;

  workspacePointersStore.subscribe((pointers) => {
    workspacesInSelector = pointers.map((pointer) => ({
      id: pointer.workspace.id,
      name: getWorkspaceName(pointer),
    }));
  });

  currentWorkspacePointerStore.subscribe((pointer) => {
    if (!pointer) {
      currentWorkspace = null;
      return;
    }

    currentWorkspace = {
      id: pointer.workspace.id,
      name: getWorkspaceName(pointer),
    };
  });

  function getWorkspaceName(pointer: WorkspacePointer) {
    let name = pointer.workspace.name;

    if (!name) {
      // Get it from the last folder in the path
      name = pointer.workspace.path.split("/").pop() || "Workspace";
    }

    return name;
  }

  function switchWorkspace(workspace: WorkspaceInSelector) {
    const pointer = $workspacePointersStore.find(
      (p) => p.workspace.id === workspace.id,
    );

    if (pointer) {
      setCurrentWorkspace(pointer);
      loadStoresFromServer();
    }
  }
</script>

<button
  class=" sidebar-btn flex items-center max-w-full"
  use:popup={popupClick}
>
  <span class="w-8 h-8 flex-shrink-0">
    <span class="relative flex h-full items-center justify-center">
      <Icon src={ChevronUpDown} mini class="w-6" />
    </span>
  </span>
  <span
    class="flex-grow text-left min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
  >
    {currentWorkspace?.name}
  </span>
</button>

<div class="card shadow-xl z-10" data-popup="workspace-selector-popup">
  <div class="arrow variant-filled" />
  <div class="btn-group-vertical variant-filled">
    {#each workspacesInSelector as workspace (workspace.id)}
      <button class="btn" on:click={() => switchWorkspace(workspace)}>
        {workspace.name}
      </button>
    {/each}
    <a href="/workspaces" class="btn mt-4">Manage workspaces</a>
  </div>
</div>
