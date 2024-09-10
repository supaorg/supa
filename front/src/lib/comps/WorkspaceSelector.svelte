<script lang="ts">
  import type { PopupSettings } from "@skeletonlabs/skeleton";
  import { popup } from "@skeletonlabs/skeleton";
  import { Icon, ChevronUpDown } from "svelte-hero-icons";
  import {
    currentWorkspaceIdStore,
    currentWorkspaceStore,
    workspacesOnClientStore,
  } from "$lib/stores/workspaceStore";

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

  $: workspacesInSelector = $workspacesOnClientStore.map((workspace) => ({
    id: workspace.pointer.workspace.id,
    name: workspace.getUIName(),
  }));

  $: currentWorkspace = $currentWorkspaceStore
    ? {
        id: $currentWorkspaceStore.pointer.workspace.id,
        name: $currentWorkspaceStore.getUIName(),
      }
    : null;

  async function switchWorkspace(workspace: WorkspaceInSelector) {
    currentWorkspaceIdStore.set(workspace.id);
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
      <button
        class="btn"
        on:click={async () => await switchWorkspace(workspace)}
      >
        {workspace.name}
      </button>
    {/each}
    <a href="/workspaces" class="btn mt-4">Manage workspaces</a>
  </div>
</div>
