<script lang="ts">
  import { clientState } from "@supa/client/state/clientState.svelte";
  import SpaceOptionsPopup from "@supa/client/comps/popups/SpaceOptionsPopup.svelte";
  import RenamingPopup from "@supa/client/comps/popups/RenamingPopup.svelte";
  import type { SpacePointer } from "@supa/client/spaces/SpacePointer";
  import { Circle, CircleCheckBig } from "lucide-svelte";

  let renamingPopupOpen = $state(false);
  let spaceToRename = $state<SpacePointer | null>(null);

  function selectSpace(spaceId: string) {
    clientState.switchToSpace(spaceId);
  }

  function handleRename(newName: string) {
    if (!spaceToRename) {
      return;
    }

    clientState.updateSpaceName(spaceToRename.id, newName);

    const updatedPointers = clientState.pointers.map((space) =>
      space.id === spaceToRename?.id ? { ...space, name: newName } : space,
    );
    clientState.pointers = updatedPointers;
    spaceToRename = null;
  }

  function openRenamePopup(space: SpacePointer) {
    spaceToRename = space;
    renamingPopupOpen = true;
  }

  function handleRemoveSpace(space: SpacePointer) {
    clientState.removeSpace(space.id);
    // So if we access the list from swins - close it
    clientState.layout.swins.pop();
  }
</script>

{#if clientState.pointers.length > 0}
  <div class="space-y-2">
    {#each clientState.pointers as space (space.id)}
      <div
        class="p-4 rounded-lg bg-surface-200-800-token border-2 {space.id ===
        clientState.currentSpaceId
          ? 'border-primary-500'
          : 'border-surface-100-900'} flex items-center gap-3"
      >
        <!-- Radio Icon -->
        <div 
          class="flex-shrink-0 cursor-pointer hover:bg-surface-300-600-token rounded p-1 -m-1"
          onclick={() => selectSpace(space.id)}
          onkeydown={(e) => e.key === "Enter" && selectSpace(space.id)}
          role="button"
          tabindex="0"
        >
          {#if space.id === clientState.currentSpaceId}
            <CircleCheckBig size={20} class="text-primary-500" />
          {:else}
            <Circle size={20} class="text-surface-500" />
          {/if}
        </div>

        <!-- Clickable Title/Subtitle Area -->
        <div
          onclick={() => selectSpace(space.id)}
          onkeydown={(e) => e.key === "Enter" && selectSpace(space.id)}
          role="button"
          tabindex="0"
          class="flex-grow cursor-pointer hover:bg-surface-300-600-token rounded px-2 py-1 -mx-2 -my-1"
        >
          <div class="font-semibold">{space.name || "New Space"}</div>
          {#if space.uri.startsWith("browser")}
            <div class="text-sm opacity-70">Local space</div>
          {:else}
            <div class="text-sm opacity-70">{space.uri}</div>
          {/if}
        </div>

        <!-- Options Button -->
        <div class="flex-shrink-0">
          <SpaceOptionsPopup
            onRename={() => openRenamePopup(space)}
            onRemove={() => handleRemoveSpace(space)}
          />
        </div>
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
