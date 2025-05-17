<script lang="ts">
  import { message, open } from "@tauri-apps/plugin-dialog";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import {
    createNewLocalSpaceAndConnect,
    loadLocalSpaceAndConnect,
  } from "$lib/spaces/LocalSpaceSync";
  import { txtStore } from "$lib/stores/txtStore";

  let {
    onSpaceSetup,
  }: { onSpaceSetup: (spaceId: string) => void | undefined } = $props();

  async function createSpaceDialog() {
    const path = await open({
      title: $txtStore.spacesPage.opener.dialogCreateTitle,
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
      onSpaceSetup?.(space.getId());
    } catch (e) {
      console.error(e);
      message($txtStore.spacesPage.opener.errorCreate, { kind: "error" });
    }
  }

  async function openSpaceDialog() {
    const path = await open({
      title: $txtStore.spacesPage.opener.dialogOpenTitle,
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
      onSpaceSetup?.(space.getId());
    } catch (e) {
      console.error(e);
      message($txtStore.spacesPage.opener.errorOpen, { kind: "error" });
    }
  }
</script>

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
    <button class="btn preset-outlined-primary-500" onclick={createSpaceDialog}
      >{$txtStore.spacesPage.opener.createButton}</button
    >
  </div>
  <div class="flex items-center justify-between mt-4">
    <div>
      <h3 class="text-lg font-semibold">
        {$txtStore.spacesPage.opener.openTitle}
      </h3>
      <p class="text-sm">{$txtStore.spacesPage.opener.openDescription}</p>
    </div>
    <button class="btn preset-outlined-primary-500" onclick={openSpaceDialog}
      >{$txtStore.spacesPage.opener.openButton}</button
    >
  </div>
</div>
