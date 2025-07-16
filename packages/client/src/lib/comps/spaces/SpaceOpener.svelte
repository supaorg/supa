<script lang="ts">
  import { txtStore } from "@supa/client/state/txtStore";
  //import { message, open } from "@tauri-apps/plugin-dialog";
  import { clientState } from "@supa/client/state/clientState.svelte";
  import { 
    checkIfPathHasValidStructureAndReturnActualRootPath
  } from "@supa/client/spaces/fileSystemSpaceUtils";

  type Status = "idle" | "creating" | "opening";
  let status: Status = $state("idle");

  let {
    onSpaceSetup,
  }: { onSpaceSetup: (spaceId: string) => void | undefined } = $props();

  async function createSpaceDialog() {
    /*
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

      // Create space with file system persistence
      const spaceId = await createFileSystemSpace(path as string);
      onSpaceSetup?.(spaceId);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : $txtStore.spacesPage.opener.errorCreate;
      message(errorMessage, { kind: "error" });
    } finally {
      status = "idle";
    }
    */
  }

  async function createFileSystemSpace(path: string): Promise<string> {
    // For now, create a local space and we'll add file system support later
    // TODO: Implement file system space creation in clientState
    const spaceId = await clientState.createNewLocalSpace(path);
    
    // TODO: Update the space pointer to use the file system path instead of local://
    // This will require extending clientState to support file system spaces
    
    return spaceId;
  }

  async function openSpaceDialog() {
    /*
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
      const rootPath = await checkIfPathHasValidStructureAndReturnActualRootPath(path as string);
      const spaceId = await openFileSystemSpace(rootPath);
      onSpaceSetup?.(spaceId);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : $txtStore.spacesPage.opener.errorOpen;
      message(errorMessage, { kind: "error" });
    } finally {
      status = "idle";
    }
    */
  }

  async function openFileSystemSpace(path: string): Promise<string> {
    // Use clientState to load the file system space
    return await clientState.loadFileSystemSpace(path);
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
