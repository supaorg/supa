import type { Writable } from "svelte/store";
import { get } from "svelte/store";
import { localStorageStore } from "@skeletonlabs/skeleton";
import { client } from "$lib/tools/client";
import { isTauri, setupServerInTauri } from "$lib/tauri/serverInTauri";
import { subscribeToSession } from "./fsPermissionDeniedStore";
import { apiRoutes } from "@shared/apiRoutes";
import type { Workspace } from "@shared/models";
import { threadsStore } from "./threadStore";
import { appConfigStore } from "./appConfigStore";
import { threadsMessagesStore } from "./threadMessagesStore";

export type WorkspacePointer = {
  type: "local" | "remote";
  url: string;
  workspace: Workspace;
}

let currentWorkspaceId = "";

export function getCurrentWorkspaceId(): string {
  return currentWorkspaceId;
}

export const currentWorkspacePointerStore: Writable<WorkspacePointer | null> = localStorageStore(
  "currentWorkspace",
  null,
);

currentWorkspacePointerStore.subscribe((pointer) => {
  if (pointer) {
    currentWorkspaceId = pointer.workspace.id;
  }
});

export const workspacePointersStore: Writable<WorkspacePointer[]> = localStorageStore(
  "workspaces",
  [],
);

export function getCurrentWorkspace(): WorkspacePointer | null {
  return get(currentWorkspacePointerStore);
}

export function getWorkspaces(): WorkspacePointer[] {
  return get(workspacePointersStore);
}

export function setCurrentWorkspace(pointer: WorkspacePointer) {
  // If the current workspace in store is different from the one we are setting - clear stores
  if (getCurrentWorkspace()?.workspace.id !== pointer.workspace.id) {
    console.log("Clearing stores");
    threadsStore.set([]);
    appConfigStore.set([]);
    threadsMessagesStore.set({});
  }

  currentWorkspacePointerStore.set(pointer);

  // Always update or add the workspace to the list
  workspacePointersStore.update((workspaces) => {
    const index = workspaces.findIndex((p) => p.workspace.id === pointer.workspace.id);
    if (index !== -1) {
      // Update existing workspace
      workspaces[index] = pointer;
    } else {
      // Add new workspace
      workspaces.push(pointer);
    }
    return workspaces;
  });
}

export async function connectOrStartServerInTauri(): Promise<void> {
  if (!isTauri()) {
    throw new Error("This function is only available in Tauri.");
  }

  const tauriIntegration = await setupServerInTauri();
  const serverWsUrl = tauriIntegration.getWebSocketUrl();

  if (client.getURL() !== serverWsUrl) {
    client.setUrl(serverWsUrl);
  }

  const serverInfoRes = await client.get(apiRoutes.root);
  if (serverInfoRes.error) {
    throw new Error(serverInfoRes.error);
  }

  //await subscribeToSession();
}

export function setLocalWorkspace(workspace: Workspace) {
  setCurrentWorkspace({
    type: "local",
    url: "http://localhost:6969",
    workspace: workspace,
  });
}

export async function connectToLocalWorkspace(pointer?: WorkspacePointer): Promise<void> {
  let serverWsUrl = pointer ? pointer.url : "ws://localhost:6969";

  if (isTauri()) {
    const tauriIntegration = await setupServerInTauri();
    serverWsUrl = tauriIntegration.getWebSocketUrl();
  }

  if (client.getURL() !== serverWsUrl) {
    client.setUrl(serverWsUrl);
  }

  const res = await client.post(apiRoutes.workspaces(), { path: pointer?.workspace.path, create: false });

  if (res.error) {
    console.error(res.error);
    return;
  }

  const workspace = res.data as Workspace;

  await subscribeToSession();

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  setCurrentWorkspace({
    type: "local",
    url: serverWsUrl,
    workspace: workspace,
  });



  /*else {
    const newWorkspaceRes = await client.post(apiRoutes.workspace, pointer?.workspace?.path);

    if (newWorkspaceRes.error) {
      throw new Error(newWorkspaceRes.error);
    }

    const newWorkspaceFromServer = newWorkspaceRes.data as Workspace;

    setCurrentWorkspace({
      type: "local",
      url: serverWsUrl,
      workspace: newWorkspaceFromServer,
    });
  }
  */
}