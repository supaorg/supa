import type { Writable } from "svelte/store";
import { get } from "svelte/store";
import { localStorageStore } from "@skeletonlabs/skeleton";
import { client } from "$lib/tools/client";
import { ServerInTauri, isTauri, setupServerInTauri } from "$lib/tauri/serverInTauri";
import { subscribeToSession } from "./fsPermissionDeniedStore";
import { apiRoutes } from "@shared/apiRoutes";
import type { ServerInfo, Workspace } from "@shared/models";

export type WorkspacePointer = {
  type: "local" | "remote";
  url: string;
  workspace: Workspace;
}

const currentWorkspacePointerStore: Writable<WorkspacePointer | null> = localStorageStore(
  "currentWorkspace",
  null,
);

const workspacePointersStore: Writable<WorkspacePointer[]> = localStorageStore(
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
  currentWorkspacePointerStore.set(pointer);

  // Check if the workspace is already in the list
  const pointers = getWorkspaces();
  const index = pointers.findIndex((p) => p.workspace.id === pointer.workspace.id);
  if (index === -1) {
    workspacePointersStore.update((workspaces) => {
      return [...workspaces, pointer];
    });
  } 
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

  const serverInfoRes = await client.get(apiRoutes.root);
  if (serverInfoRes.error) {
    throw new Error(serverInfoRes.error);
  }

  const serverInfo = serverInfoRes.data as ServerInfo;

  if (pointer && serverInfo.workspace?.path && serverInfo.workspace.id !== pointer.workspace.id) {
    throw new Error("Workspace path mismatch");
  }

  await subscribeToSession();

  if (serverInfo.workspace) {
    setCurrentWorkspace({
      type: "local",
      url: serverWsUrl,
      workspace: serverInfo.workspace,
    });
  } else {
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
}