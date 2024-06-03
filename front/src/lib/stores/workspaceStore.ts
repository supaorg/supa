import type { Writable } from "svelte/store";
import { get } from "svelte/store";
import { localStorageStore } from "@skeletonlabs/skeleton";
import { client } from "$lib/tools/client";
import { ServerInTauri, isTauri, setupServerInTauri } from "$lib/tauri/serverInTauri";
import { subscribeToSession } from "./fsPermissionDeniedStore";
import { routes } from "@shared/routes/routes";
import type { ServerInfo } from "@shared/models";

export type WorkspaceInfo = LocalWorkspaceInfo | RemoteWorkspaceInfo;

export type LocalWorkspaceInfo = {
  id: string;
  type: "local" | "remote";
  path: string;
  url: string;
}

export type RemoteWorkspaceInfo = {
  id: string;
  type: "remote";
  url: string;
}

const currentWorkspaceStore: Writable<WorkspaceInfo | null> = localStorageStore(
  "currentWorkspace",
  null,
);

const workspacesStore: Writable<WorkspaceInfo[]> = localStorageStore(
  "workspaces",
  [],
);

export function getCurrentWorkspace(): WorkspaceInfo | null {
  return get(currentWorkspaceStore);
}

export function getWorkspaces(): WorkspaceInfo[] {
  return get(workspacesStore);
}

export function setCurrentWorkspace(workspace: WorkspaceInfo) {
  currentWorkspaceStore.set(workspace);

  // Check if the workspace is already in the list
  const workspaces = getWorkspaces();
  const index = workspaces.findIndex((w) => w.id === workspace.id);
  if (index === -1) {
    workspacesStore.update((workspaces) => {
      return [...workspaces, workspace];
    });
  } 
}

export async function connectToLocalWorkspace(workspace?: LocalWorkspaceInfo): Promise<void> {
  let serverWsUrl = workspace ? workspace.url : "ws://localhost:6969";

  if (isTauri()) {
    const tauriIntegration = await setupServerInTauri();
    serverWsUrl = tauriIntegration.getWebSocketUrl();
  }

  if (client.getURL() !== serverWsUrl) {
    client.setUrl(serverWsUrl);
  }

  const serverInfoRes = await client.get(routes.root);
  if (serverInfoRes.error) {
    throw new Error(serverInfoRes.error);
  }

  const serverInfo = serverInfoRes.data as ServerInfo;

  if (workspace && serverInfo.workspacePath && serverInfo.workspacePath !== workspace.path) {
    throw new Error("Workspace path mismatch");
  }

  await subscribeToSession();

  if (serverInfo.workspacePath) {
    setCurrentWorkspace({
      id: "local", // use id from server
      type: "local",
      path: serverInfo.workspacePath,
      url: serverWsUrl,
    });
  } else {
    const newWorkspaceRes = await client.post(routes.workspace, workspace?.path);

    if (newWorkspaceRes.error) {
      throw new Error(newWorkspaceRes.error);
    }

    const newWorkspaceFromServer = newWorkspaceRes.data as LocalWorkspaceInfo;

    setCurrentWorkspace(newWorkspaceFromServer);
  }
}

export async function connectToRemoteWorkspace(workspace: RemoteWorkspaceInfo): Promise<RemoteWorkspaceInfo> {
  throw new Error("Not implemented");
}