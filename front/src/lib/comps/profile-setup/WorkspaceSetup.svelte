<script lang="ts">
  import { ProgressRadial, Step, Stepper } from "@skeletonlabs/skeleton";
  import { client } from "$lib/tools/client";
  import { CheckCircle, Icon } from "svelte-hero-icons";
  import CenteredPage from "../CenteredPage.svelte";
  import { message, open } from "@tauri-apps/api/dialog";
  import { apiRoutes } from "@shared/apiRoutes";
  import {
    connectOrStartServerInTauri,
    setLocalWorkspace,
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

    const res = await client.post(apiRoutes.workspaces(), { path, create: true });

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

    const res = await client.post(apiRoutes.workspaces(), { path, create: false });

    if (res.error) {
      console.error(res.error);
      message(res.error, { type: "error" });
      return;
    }

    const workspace = res.data as Workspace;
    setLocalWorkspace(workspace);

    onWorkspaceSetup(workspace);
  }
</script>

<CenteredPage>
  <div class="card p-4 mt-4 space-y-4">
    <h2 class="h2">Let's setup a workspace</h2>
    <p class="mb-6">
      A 'workspace' is where your conversations and other data is stored. You
      can have multiple workspaces and switch between them. For example, one can
      be for work and another personal.
    </p>

    <div>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold">Create a workspace in iCloud</h3>
          <p class="text-sm">
            The content will be stored and synced in iCloud. This is the best
            option if you use Supamind on MacOS and eventually iOS. We will make
            an iOS app at some point.
          </p>
        </div>
        <button class="btn variant-filled-primary">Create</button>
      </div>
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
