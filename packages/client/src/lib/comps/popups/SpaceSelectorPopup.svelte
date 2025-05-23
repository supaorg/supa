<script lang="ts">
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import ContextMenu from "$lib/comps/ui/ContextMenu.svelte";
  import { openSpaces } from "$lib/swins";
  import { ChevronsUpDown } from "lucide-svelte";

  let openState = $state(false);
</script>

<ContextMenu
  open={openState}
  onOpenChange={(e) => openState = e.open}
  placement="bottom"
  triggerClassNames="w-full"
>
  {#snippet trigger()}
    <div class="w-full h-full">
      <div class="flex items-center gap-2 w-full h-full py-1 px-1 rounded hover:preset-tonal">
        <ChevronsUpDown size={18} class="flex-shrink-0" />
        <span class="flex-1 min-w-0 truncate text-left">{spaceStore.currentSpace?.name}</span>
      </div>
    </div>
  {/snippet}
  {#snippet content()}
    <div class="flex flex-col gap-1">
      {#each spaceStore.pointers as pointer (pointer.id)}
        <button
          class="btn btn-sm w-full text-left justify-start"
          class:preset-filled-secondary-500={pointer.id === spaceStore.currentSpaceId}
          onclick={() => spaceStore.currentSpaceId = pointer.id}
        >
          <span><strong>{pointer.name || "Space"}</strong></span>
        </button>
      {/each}
    </div>
    <div class="flex flex-col gap-1 mt-4">
      <button class="btn btn-sm w-full text-left justify-start" onclick={() => {
        openSpaces();
        openState = false;
      }}>
        Manage spaces
      </button>
    </div>
  {/snippet}
</ContextMenu>
