<script lang="ts">
    import { txtStore } from "$lib/state/txtStore";
  import { message, open } from "@tauri-apps/plugin-dialog";
  /*
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import {
  checkIfPathHasValidStructureAndReturnActualRootPath,
    createNewLocalSpaceAndConnect,
    loadLocalSpaceAndConnect,
  } from "$lib/spaces/LocalSpaceSync";
  import { txtStore } from "$lib/stores/txtStore";
  */

  type Status = "idle" | "creating" | "opening";
  let status: Status = $state("idle");

  let {
    onSpaceSetup,
  }: { onSpaceSetup: (spaceId: string) => void | undefined } = $props();

  async function createSpaceDialog() {
    if (status !== "idle") return;

    status = "creating";
    try {
      const path = await open({
        title: $txtStore.spacesPage.opener.dialogCreateTitle,
        directory: true,
      });

      if (!path) {
        status = "idle";
        return;
      }

      /*
      const spaceSync = await createNewLocalSpaceAndConnect(path as string);
      const space = spaceSync.space;
      spaceStore.addLocalSpace(spaceSync, path as string);
      spaceStore.currentSpaceId = space.getId();
      onSpaceSetup?.(space.getId());
      */
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : $txtStore.spacesPage.opener.errorCreate;
      message(errorMessage, { kind: "error" });
    } finally {
      status = "idle";
    }
  }

  async function openSpaceDialog() {
    if (status !== "idle") return;

    status = "opening";
    try {
      const path = await open({
        title: $txtStore.spacesPage.opener.dialogOpenTitle,
        directory: true,
      });

      if (!path) {
        status = "idle";
        return;
      }

      // We do this to allow users open spaces from any directory inside the space directory 
      /*
      const rootPath = await checkIfPathHasValidStructureAndReturnActualRootPath(path as string);
      const spaceSync = await loadLocalSpaceAndConnect(rootPath);
      const space = spaceSync.space;
      spaceStore.currentSpaceId = space.getId();
      spaceStore.addLocalSpace(spaceSync, rootPath);
      onSpaceSetup?.(space.getId());
      */
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : $txtStore.spacesPage.opener.errorOpen;
      message(errorMessage, { kind: "error" });
    } finally {
      status = "idle";
    }
  }
</script>

<div class="flex justify-between items-center pb-4">
  <h3 class="h3">Create or open a space</h3>
</div>
<p class="mb-6">
  You can create a new space or open an existing one.
</p>

<div>
  <div class="flex items-center justify-between mt-4">
    <div>
      <h3 class="text-lg font-semibold">
        {$txtStore.spacesPage.opener.createTitle}
      </h3>
      <p class="text-sm">
        {$txtStore.spacesPage.opener.createDescription}
      </p>
    </div>
    <button
      class="btn preset-outlined-primary-500"
      onclick={createSpaceDialog}
      disabled={status !== "idle"}
    >
      {status === "creating"
        ? "Creating..."
        : $txtStore.spacesPage.opener.createButton}
    </button>
  </div>
  <div class="flex items-center justify-between mt-4">
    <div>
      <h3 class="text-lg font-semibold">
        {$txtStore.spacesPage.opener.openTitle}
      </h3>
      <p class="text-sm">{$txtStore.spacesPage.opener.openDescription}</p>
    </div>
    <button
      class="btn preset-outlined-primary-500"
      onclick={openSpaceDialog}
      disabled={status !== "idle"}
    >
      {status === "opening"
        ? "Opening..."
        : $txtStore.spacesPage.opener.openButton}
    </button>
  </div>
</div>
