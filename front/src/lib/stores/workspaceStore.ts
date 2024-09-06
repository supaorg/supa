/**
 * This is a persistent store of pointers to workspaces.
 * We use pointers to connect to workspaces.
 */

import type { Readable, Writable } from "svelte/store";
import { writable, get, derived } from "svelte/store";
import { localStorageStore } from "@skeletonlabs/skeleton";
import type { Workspace } from "@shared/models";
import { WorkspaceOnClient } from "./workspaceOnClient";

export type WorkspacePointer = {
  type: "local" | "remote";
  url: string;
  workspace: Workspace;
}


const workspacePointersStore: Writable<WorkspacePointer[]> = localStorageStore(
  "workspacePointers",
  [],
);
export const currentWorkspaceIdStore: Writable<string | null> = localStorageStore("currentWorkspaceId", null);
export const workspacesOnClientStore: Writable<WorkspaceOnClient[]> = writable<WorkspaceOnClient[]>([]);
export const currentWorkspaceOnClient: Readable<WorkspaceOnClient | null> = derived(
  [currentWorkspaceIdStore, workspacesOnClientStore],
  ([$currentWorkspaceId, $workspacesOnClient]) => {
    return $workspacesOnClient.find(workspace => workspace.pointer.workspace.id === $currentWorkspaceId) || null;
  }
);

export function getCurrentWorkspaceId(): string | null {
  return get(currentWorkspaceIdStore);
}

/**
 * Create workspaces from pointers and connect to the current one.
 * @returns 
 */
export async function loadWorkspacesAndConnect(): Promise<WorkspaceOnClient | null> {
  if (get(workspacesOnClientStore).length > 0) {
    throw new Error("Workspaces already loaded. Can do it only once.");
  }

  const workspacesOnClient: WorkspaceOnClient[] = [];

  let currentWorkspaceOnClient: WorkspaceOnClient | null = null;

  // First create workspaces on client for all pointers and connect to one if it's the current workspace
  for (const pointer of get(workspacePointersStore)) {
    const workspace = new WorkspaceOnClient(pointer);

    if (get(currentWorkspaceIdStore) === pointer.workspace.id) {
      try {
        await workspace.connect();
        currentWorkspaceOnClient = workspace;
      } catch (error) {
        console.error("Could not connect to workspace", pointer, error);
      }
    }

    workspacesOnClient.push(workspace);
  } 
  
  workspacesOnClientStore.set(workspacesOnClient);

  return currentWorkspaceOnClient;
}