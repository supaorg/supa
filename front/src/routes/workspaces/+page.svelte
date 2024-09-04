<script lang="ts">
  import { client } from "$lib/tools/client";
  import CenteredPage from "$lib/comps/CenteredPage.svelte";
  import { message, open } from "@tauri-apps/api/dialog";
  import { apiRoutes } from "@shared/apiRoutes";
  import {
    connectOrStartServerInTauri,
    workspacePointersStore,
    setLocalWorkspace,
    type WorkspacePointer,
  } from "$lib/stores/workspaceStore";
  import type { Workspace } from "@shared/models";

  // Expose a function to be called from the parent component
  export let onWorkspaceSetup: (workspace: Workspace) => void = () => {};

  async function createWorkspaceDialog() {
    const path = await open({
      title: "Select a folder for a new workspace",
      directory: true,
    });

    if (!path) {
      return;
    }

    await connectOrStartServerInTauri();

    const res = await client.post(apiRoutes.workspaces(), {
      path,
      create: true,
    });

    if (res.error) {
      console.error(res.error);
      message(res.error, { type: "error" });
      return;
    }

    const workspace = res.data as Workspace;
    setLocalWorkspace(workspace);

    onWorkspaceSetup(workspace);
  }

  async function openWorkspaceDialog() {
    const path = await open({
      title: "Select a folder for a new workspace",
      directory: true,
    });

    if (!path) {
      return;
    }

    await connectOrStartServerInTauri();

    const res = await client.post(apiRoutes.workspaces(), {
      path,
      create: false,
    });

    if (res.error) {
      console.error(res.error);
      message(res.error, { type: "error" });
      return;
    }

    const workspace = res.data as Workspace;
    setLocalWorkspace(workspace);

    onWorkspaceSetup(workspace);
  }

  import {
    ListBox,
    ListBoxItem,
    type PopupSettings,
  } from "@skeletonlabs/skeleton";
  import {
    currentWorkspacePointerStore,
    setCurrentWorkspace,
  } from "$lib/stores/workspaceStore";
  import { CheckCircle, Icon } from "svelte-hero-icons";

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
  let selectedWorkspaceId: string = "";

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

    selectedWorkspaceId = currentWorkspace.id;
  });

  function getWorkspaceName(pointer: WorkspacePointer) {
    let name = pointer.workspace.name;

    if (!name) {
      // Get it from the last folder in the path
      name = pointer.workspace.path.split("/").pop() || "Workspace";
    }

    return name;
  }

  function onSwitchWorkspace(event: Event) {
    const targetWorkspace = $workspacePointersStore.find(
      (p) => p.workspace.id === selectedWorkspaceId
    );
    if (targetWorkspace) {
      setCurrentWorkspace(targetWorkspace);
    }
  }
</script>

<CenteredPage>
  <div class="card p-4 mt-4 space-y-4">
    <h2 class="h2">Workspaces</h2>
    <p class="mb-6">
      A 'workspace' is where your conversations and other data is stored. You
      can have multiple workspaces and switch between them. For example, one can
      be for work and another personal.
    </p>

    <ListBox>
      {#each workspacesInSelector as workspace}
        <ListBoxItem
          on:change={onSwitchWorkspace}
          bind:group={selectedWorkspaceId}
          name="workspace"
          value={workspace.id}
        >
          {workspace.name}
        </ListBoxItem>
      {/each}
    </ListBox>

    <div>
      <div class="flex items-center justify-between mt-4">
        <div>
          <h3 class="text-lg font-semibold">
            Create a workspace in any folder
          </h3>
          <p class="text-sm">
            Create a new workspace. It could be local folder or a folder in a
            cloud service like Dropbox or Google Drive. Make sure the folder is
            empty.
          </p>
        </div>
        <button
          class="btn variant-ringed-primary"
          on:click={createWorkspaceDialog}>Create</button
        >
      </div>
      <div class="flex items-center justify-between mt-4">
        <div>
          <h3 class="text-lg font-semibold">Open an existing workspace</h3>
          <p class="text-sm">
            Open a folder that contains your workspace files.
          </p>
        </div>
        <button
          class="btn variant-ringed-primary"
          on:click={openWorkspaceDialog}>Open</button
        >
      </div>
    </div>
  </div>
</CenteredPage>
