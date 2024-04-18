import type { Writable } from "svelte/store";
import { get } from "svelte/store";
import { localStorageStore } from "@skeletonlabs/skeleton";

export type Workspace = {
  uri: string;
}

const currentWorkspaceStore: Writable<Workspace | null> = localStorageStore(
  "currentWorkspace",
  null,
);

const workspacesStore: Writable<Workspace[]> = localStorageStore(
  "workspaces",
  [],
);

export function getCurrentWorkspace(): Workspace | null {
  return get(currentWorkspaceStore);
}

export function getWorkspaces(): Workspace[] {
  return get(workspacesStore);
}

export function createWorkspace(uri: string): Workspace {
  const workspace: Workspace = {
    uri,
  };

  workspacesStore.update((workspaces) => {
    return [...workspaces, workspace];
  });

  return workspace;
}

export function setCurrentWorkspace(workspace: Workspace) {
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
