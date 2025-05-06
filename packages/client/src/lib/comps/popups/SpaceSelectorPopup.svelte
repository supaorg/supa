<script lang="ts">
  import { goto } from "$app/navigation";
  import { spaceStore } from "$lib/spaces/spaces.svelte";
  import ContextMenu from "$lib/comps/ui/ContextMenu.svelte";
  import { openSpaces } from "$lib/spages";

  import { ChevronsUpDown } from "lucide-svelte";
  import { onMount } from "svelte";

  let openState = $state(false);

  let selectedSpaceId = $state<string | null>(null);

  onMount(() => {
    selectedSpaceId = spaceStore.currentSpaceId;
  });

  $effect(() => {
    // Only update if the selected ID is different from current
    if (selectedSpaceId !== spaceStore.currentSpaceId) {
      spaceStore.currentSpaceId = selectedSpaceId;
      
      const pointer = spaceStore.currentPointer;
      if (pointer && pointer.lastPageUrl) {
        goto(pointer.lastPageUrl);
      } else {
        goto("/");
      }
    }
  });
</script>

<ContextMenu
  open={openState}
  onOpenChange={(e) => openState = e.open}
  placement="bottom"
  triggerClassNames="flex-grow"
>
  {#snippet trigger()}
    <div class="flex items-center gap-2">
      <ChevronsUpDown size={18} />
      <span class="flex-grow text-left">{spaceStore.currentSpace?.name}</span>
    </div>
  {/snippet}
  {#snippet content()}
    <div class="flex flex-col gap-1">
      {#each spaceStore.pointers as pointer (pointer.id)}
        <button
          class="btn btn-sm w-full text-left justify-start"
          class:preset-filled-secondary-500={pointer.id === selectedSpaceId}
          onclick={() => selectedSpaceId = pointer.id}
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
