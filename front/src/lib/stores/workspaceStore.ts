/**
 * This is a persistent store of pointers to workspaces.
 * We use pointers to connect to workspaces.
 */

import type { Readable, Writable } from "svelte/store";
import { writable, get, derived } from "svelte/store";
import { localStorageStore } from "@skeletonlabs/skeleton";
import type { AppConfig, Thread, Workspace } from "@shared/models";
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
export const currentWorkspaceOnClientStore: Readable<WorkspaceOnClient | null> = derived(
  [currentWorkspaceIdStore, workspacesOnClientStore],
  ([$currentWorkspaceId, $workspacesOnClient]) => {
    return $workspacesOnClient.find(workspace => workspace.pointer.workspace.id === $currentWorkspaceId) || null;
  }
);

export const currentWorkspaceThreadsStore: Readable<Thread[]> = derived(
  currentWorkspaceOnClientStore,
  ($currentWorkspaceOnClient) => $currentWorkspaceOnClient?.threads ? get($currentWorkspaceOnClient.threads) : []
);

export const currentWorkspaceAppConfigsStore: Readable<AppConfig[]> = derived(
  currentWorkspaceOnClientStore,
  ($currentWorkspaceOnClient) => $currentWorkspaceOnClient?.appConfigs ? get($currentWorkspaceOnClient.appConfigs) : []
);

export function getCurrentWorkspaceId(): string | null {
  return get(currentWorkspaceIdStore);
}

/**
 * Create workspaces from pointers and connect to the current one.
 * @returns 
 */
export async function loadWorkspacesAndConnectToCurrent(): Promise<WorkspaceOnClient | null> {
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

export async function connectToWorkspaceId(workspaceId: string): Promise<WorkspaceOnClient | null> {
  const pointer = get(workspacePointersStore).find((pointer) => pointer.workspace.id === workspaceId);
  if (!pointer) {
    throw new Error(`Workspace with id ${workspaceId} not found`);
  }
  const workspace = new WorkspaceOnClient(pointer);
  await workspace.connect();
  return workspace;
}