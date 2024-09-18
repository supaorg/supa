/**
 * This is a persistent store of pointers to workspaces.
 * We use pointers to connect to workspaces.
 */

import type { Readable, Writable } from "svelte/store";
import { writable, get, derived } from "svelte/store";
import { localStorageStore } from "@skeletonlabs/skeleton";
import type { AppConfig, Thread } from "@shared/models";
import { WorkspaceOnClient, type WorkspacePointer } from "./workspaceOnClient";


const pointersToWorkspacesStore: Writable<WorkspacePointer[]> = localStorageStore(
  "workspacePointers",
  [],
);
export const currentWorkspaceIdStore: Writable<string | null> = localStorageStore("currentWorkspaceId", null);
export const workspacesOnClientStore: Writable<WorkspaceOnClient[]> = writable<WorkspaceOnClient[]>([]);
export const currentWorkspaceStore: Readable<WorkspaceOnClient | null> = derived(
  [currentWorkspaceIdStore, workspacesOnClientStore],
  ([$currentWorkspaceId, $workspacesOnClient]) => {
    return $workspacesOnClient.find(workspace => workspace.getId() === $currentWorkspaceId) || null;
  }
);

export const threadsStore: Readable<Thread[]> = derived(
  currentWorkspaceStore,
  ($currentWorkspaceStore) => $currentWorkspaceStore?.threads ? get($currentWorkspaceStore.threads) : []
);

export const appConfigsStore: Readable<AppConfig[]> = derived(
  currentWorkspaceStore,
  ($currentWorkspaceStore) => $currentWorkspaceStore?.appConfigs ? get($currentWorkspaceStore.appConfigs) : []
);

export const visibleAppConfigsStore: Readable<AppConfig[]> = derived(
  appConfigsStore,
  ($appConfigsStore) => $appConfigsStore.filter((appConfig) => appConfig.meta?.visible)
);

export function getCurrentWorkspaceId(): string | null {
  return get(currentWorkspaceIdStore);
}

/**
 * Create workspaces from pointers and connect to the current one.
 * Use it only once on startup.
 * @returns
 */
export async function loadWorkspacesAndConnectToCurrent(): Promise<WorkspaceOnClient | null> {
  if (get(workspacesOnClientStore).length > 0) {
    throw new Error("Workspaces already loaded. Can do it only once.");
  }

  const workspacesOnClient: WorkspaceOnClient[] = [];

  let currentWorkspaceOnClient: WorkspaceOnClient | null = null;

  // First create workspaceOnClient objects from all the pointers
  for (const pointer of get(pointersToWorkspacesStore)) {
    const workspace = new WorkspaceOnClient(pointer);
    workspacesOnClient.push(workspace);
  }

  // And then try to connect to the current workspace, if it's set.
  if (get(currentWorkspaceIdStore)) {
    // Check if it matches any of the pointers
    const pointer = get(pointersToWorkspacesStore).find((pointer) => pointer.id === get(currentWorkspaceIdStore));
    if (pointer) {
      currentWorkspaceOnClient = new WorkspaceOnClient(pointer);
    }
  }
  // Or the first one that connects successfully
  if (!currentWorkspaceOnClient) {
    // Try to connect to the first one that connects successfully
    for (const workspace of workspacesOnClient) {
      try {
        await workspace.connect();
        currentWorkspaceOnClient = workspace;
        break;
      } catch (error) {
        console.error("Could not connect to workspace", workspace, error);
      }
    }
  }

  workspacesOnClientStore.set(workspacesOnClient);

  return currentWorkspaceOnClient;
}

export async function connectToWorkspaceByPath(path: string, createIfNotExists: boolean = false): Promise<WorkspaceOnClient | null> {
  const newPointer: WorkspacePointer = {
    type: "local",
    path,
    url: ""
  };

  const workspace = new WorkspaceOnClient(newPointer);
  await workspace.connect(createIfNotExists);

  pointersToWorkspacesStore.update((pointers) => {
    return [...pointers, newPointer];
  });

  workspacesOnClientStore.update((workspaces) => {
    return [...workspaces, workspace];
  });

  currentWorkspaceIdStore.set(workspace.getId());

  return workspace;
}

export async function connectToWorkspaceId(workspaceId: string): Promise<WorkspaceOnClient | null> {
  const pointer = get(pointersToWorkspacesStore).find((pointer) => pointer.id === workspaceId);
  if (!pointer) {
    throw new Error(`Workspace with id ${workspaceId} not found`);
  }
  const workspace = new WorkspaceOnClient(pointer);
  await workspace.connect();
  return workspace;
}