import { api, API_BASE_URL } from "$lib/utils/api";
import type { SpaceCreationResponse } from "@core/apiTypes";
import { createNewInBrowserSpaceSync, createNewInBrowserSpaceSyncWithOps, InBrowserSpaceSync, loadExistingInBrowserSpaceSync } from "./InBrowserSpaceSync";
import { spaceStore } from "./spaceStore.svelte";
import { RepTree, uuid } from "@core";
import Space from "@core/spaces/Space";

export async function createNewLocalSpace() {
  const sync = await createNewInBrowserSpaceSync();
  spaceStore.addSpaceConnection(sync, "browser://" + sync.space.getId());
  spaceStore.currentSpaceId = sync.space.getId();
}

export async function createNewSyncedSpace() {
  const response = await api.post<SpaceCreationResponse>('/spaces');

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create space');
  }

  const uri = `${API_BASE_URL}/spaces/` + response.data.id;

  const sync = await createNewInBrowserSpaceSyncWithOps(response.data.operations, uri);
  
  // Add space connection with the userId from the server response
  const pointer = {
    id: sync.space.getId(),
    uri: uri,
    name: sync.space.name || null,
    createdAt: sync.space.createdAt,
    userId: response.data.owner_id,
  };
  
  spaceStore.connections = [...spaceStore.connections, sync];
  spaceStore.pointers = [...spaceStore.pointers, pointer];
  
  spaceStore.currentSpaceId = sync.space.getId();
}