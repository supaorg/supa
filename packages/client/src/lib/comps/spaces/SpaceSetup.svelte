<script lang="ts">
  import { message, open } from "@tauri-apps/plugin-dialog";
  import CenteredPage from "$lib/comps/basic/CenteredPage.svelte";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import {
    createNewLocalSpaceAndConnect,
    loadLocalSpaceAndConnect,
  } from "$lib/spaces/LocalSpaceSync";

  export let onSpaceSetup: (spaceId: string) => void = () => {};

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
      spaceStore.addLocalSpace(spaceSync, path as string);
      spaceStore.currentSpaceId = space.getId();
      onSpaceSetup(space.getId());
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
      spaceStore.currentSpaceId = space.getId();
      spaceStore.addLocalSpace(spaceSync, path as string);
      onSpaceSetup(space.getId());
    } catch (e) {
      console.error(e);
      message("Failed to open space", { kind: "error" });
    }
  }
</script>

<CenteredPage>
  <div class="card p-4 mt-4 space-y-4">
    <h2 class="h2">Let's setup a space</h2>
    <p class="mb-6">
      A space is where your AI apps and other data is stored. You can have
      multiple spaces and switch between them. For example, one can be for work
      and another personal.
    </p>

    <div>
      <div class="flex items-center justify-between mt-4">
        <div>
          <h3 class="text-lg font-semibold">Create a new space</h3>
          <p class="text-sm">
            Choose a folder for your new space. It could be local folder or a
            folder synced with iCloud, Dropbox, Google Drive, etc. Make sure the
            folder is empty.
          </p>
        </div>
        <button class="btn preset-outlined-primary-500" on:click={createSpaceDialog}
          >Create</button
        >
      </div>
      <div class="flex items-center justify-between mt-4">
        <div>
          <h3 class="text-lg font-semibold">Open a space</h3>
          <p class="text-sm">Open a folder that contains your space.</p>
        </div>
        <button class="btn preset-outlined-primary-500" on:click={openSpaceDialog}
          >Open</button
        >
      </div>
    </div>
  </div>
</CenteredPage>
