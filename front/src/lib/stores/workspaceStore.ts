import type { Writable } from "svelte/store";
import { get } from "svelte/store";
import { localStorageStore } from "@skeletonlabs/skeleton";

export type WorkspaceInfo = {
  uri: string;
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

export function createWorkspace(uri: string): WorkspaceInfo {
  const workspace: WorkspaceInfo = {
    uri,
  };

  workspacesStore.update((workspaces) => {
    return [...workspaces, workspace];
  });

  return workspace;
}

export function setCurrentWorkspace(workspace: WorkspaceInfo) {
  currentWorkspaceStore.set(workspace);

  // Check if the workspace is already in the list
  const workspaces = getWorkspaces();
  const index = workspaces.findIndex((w) => w.uri === workspace.uri);
  if (index === -1) {
    workspacesStore.update((workspaces) => {
      return [...workspaces, workspace];
    });
  } 
}
