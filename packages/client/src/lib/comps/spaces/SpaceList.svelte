<script lang="ts">
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import SpaceOptionsPopup from "$lib/comps/popups/SpaceOptionsPopup.svelte";
  import RenamingPopup from "$lib/comps/popups/RenamingPopup.svelte";
  import type { SpacePointer } from "$lib/spaces/SpacePointer";
  import { swins } from "$lib/swins";

  let renamingPopupOpen = $state(false);
  let spaceToRename = $state<SpacePointer | null>(null);

  function selectSpace(spaceId: string) {
    spaceStore.currentSpaceId = spaceId;
  }

  function handleRename(newName: string) {
    if (!spaceToRename) {
      return;
    }

    const space = spaceStore.getLoadedSpaceFromPointer(spaceToRename);
    if (space) {
      space.name = newName;
    }

    const updatedPointers = spaceStore.pointers.map((space) =>
      space.id === spaceToRename?.id ? { ...space, name: newName } : space,
    );
    spaceStore.pointers = updatedPointers;
    spaceToRename = null;
  }

  function openRenamePopup(space: SpacePointer) {
    spaceToRename = space;
    renamingPopupOpen = true;
  }

  function handleRemoveSpace(space: SpacePointer) {
    spaceStore.removeSpace(space.id);
    // So if we access the list from swins - close it
    swins.pop();
  }
</script>

{#if spaceStore.pointers.length > 0}
  <div class="space-y-2">
    {#each spaceStore.pointers as space (space.id)}
      <div
        class="p-4 rounded-lg bg-surface-200-800-token border-2 {space.id ===
        spaceStore.currentSpaceId
          ? 'border-primary-500'
          : 'border-surface-100-900'} hover:bg-surface-300-600-token cursor-pointer flex items-center justify-between"
      >
        <div
          onclick={() => selectSpace(space.id)}
          onkeydown={(e) => e.key === "Enter" && selectSpace(space.id)}
          role="button"
          tabindex="0"
          class="flex-grow"
        >
          <div class="font-semibold">{space.name || "Unnamed Space"}</div>
          <div class="text-sm opacity-70">{space.uri}</div>
        </div>

        <SpaceOptionsPopup 
          onRename={() => openRenamePopup(space)} 
          onRemove={() => handleRemoveSpace(space)}
        />
      </div>
    {/each}
  </div>
{:else}
  <p class="text-center opacity-70">No spaces found</p>
{/if}

{#if spaceToRename}
  <RenamingPopup
    bind:open={renamingPopupOpen}
    existingName={spaceToRename.name ? spaceToRename.name : undefined}
    onRename={handleRename}
  />
{/if}

<style>
  .space-y-2 > :not([hidden]) ~ :not([hidden]) {
    margin-top: 0.5rem;
  }
</style>
