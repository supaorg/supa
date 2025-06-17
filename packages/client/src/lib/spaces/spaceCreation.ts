import { api } from "$lib/utils/api";
import type { SpaceCreationResponse } from "@core/apiTypes";
import { createNewInBrowserSpaceSync, InBrowserSpaceSync, loadExistingInBrowserSpaceSync } from "./InBrowserSpaceSync";
import { spaceStore } from "./spaceStore.svelte";
import { RepTree, uuid } from "@core";
import Space from "@core/spaces/Space";

export async function createNewLocalSpace() {
  const sync = await createNewInBrowserSpaceSync();

  spaceStore.addLocalSpace(sync, "browser://" + sync.space.getId());
  spaceStore.currentSpaceId = sync.space.getId();
}

export async function createNewSyncedSpace() {
  const response = await api.post<SpaceCreationResponse>('/spaces');

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create space');
  }

  // Create a new space using id and ops from the response

  const space = new Space(new RepTree(uuid(), response.data.operations));
  const sync = new InBrowserSpaceSync(space);
  sync.addOpsToSave(space.getId(), space.tree.getAllOps());
  spaceStore.addLocalSpace(sync, "localhost:3131/spaces/" + response.data.id);
  spaceStore.currentSpaceId = response.data.id;
  await sync.connect();
}