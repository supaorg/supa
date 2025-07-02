import { api, API_BASE_URL } from "$lib/utils/api";
import type { SpaceCreationResponse } from "@core/apiTypes";
import { clientState } from "../state/clientState.svelte";
import { createNewLocalSpace as createNewManagedLocalSpace } from "./spaceManagerSetup";

export async function createNewLocalSpace() {
  // Use new SpaceManager approach for local spaces
  const connection = await createNewManagedLocalSpace();
  
  // Add pointer to store
  const pointer = {
    id: connection.space.getId(),
    uri: "local://" + connection.space.getId(),
    name: connection.space.name || null,
    createdAt: connection.space.createdAt,
    userId: clientState.auth.user?.id || null,
  };
  
  clientState.spaces.addSpacePointer(pointer);
  clientState.spaces.currentSpaceId = connection.space.getId();
}

export async function createNewSyncedSpace() {
  // @TODO: update this to use the latest architecture

  /*
  const response = await api.post<SpaceCreationResponse>('/spaces');

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create space');
  }

  const uri = `${API_BASE_URL}/spaces/` + response.data.id;

  const sync = await createNewInBrowserSpaceSyncWithOps(response.data.operations, uri);
  
  // Add space pointer with the userId from the server response
  const pointer = {
    id: sync.space.getId(),
    uri: uri,
    name: sync.space.name || null,
    createdAt: sync.space.createdAt,
    userId: response.data.owner_id,
  };
  
  clientState.spaces.addSpacePointer(pointer);
  clientState.spaces.currentSpaceId = sync.space.getId();
  */
}