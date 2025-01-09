<script lang="ts">
  import { message, open } from "@tauri-apps/plugin-dialog";
  import { addLocalSpace, currentSpaceIdStore } from "$lib/spaces/spaceStore";
  import {
    createNewLocalSpaceAndConnect,
    loadLocalSpaceAndConnect,
  } from "$lib/spaces/LocalSpaceSync";

  let { onSpaceSetup }: { onSpaceSetup: (spaceId: string) => void | undefined } = $props();

  async function createSpaceDialog() {
    const path = await open({
      title: "Select a folder for a new space",
      directory: true,
    });

    if (!path) {
      return;
    }

    try {
      const spaceSync = await createNewLocalSpaceAndConnect(path as string);
      const space = spaceSync.space;
      addLocalSpace(space, path as string);
      currentSpaceIdStore.set(space.getId());
      onSpaceSetup?.(space.getId());
    } catch (e) {
      console.error(e);
      message("Failed to create space", { kind: "error" });
    }
  }

  async function openSpaceDialog() {
    const path = await open({
      title: "Select a folder with a space",
      directory: true,
    });

    if (!path) {
      return;
    }

    try {
      const spaceSync = await loadLocalSpaceAndConnect(path as string);
      const space = spaceSync.space;
      currentSpaceIdStore.set(space.getId());
      addLocalSpace(space, path as string);
      onSpaceSetup?.(space.getId());
    } catch (e) {
      console.error(e);
      message("Failed to open space", { kind: "error" });
    }
  }
</script>

<div>
  <div class="flex items-center justify-between mt-4">
    <div>
      <h3 class="text-lg font-semibold">Create a new space</h3>
      <p class="text-sm">
        Choose a folder for your new space. It could be local folder or a folder
        synced with iCloud, Dropbox, Google Drive, etc. Make sure the folder is
        empty.
      </p>
    </div>
    <button class="btn variant-ringed-primary" onclick={createSpaceDialog}
      >Create</button
    >
  </div>
  <div class="flex items-center justify-between mt-4">
    <div>
      <h3 class="text-lg font-semibold">Open a space</h3>
      <p class="text-sm">Open a folder that contains your space.</p>
    </div>
    <button class="btn variant-ringed-primary" onclick={openSpaceDialog}
      >Open</button
    >
  </div>
</div>
