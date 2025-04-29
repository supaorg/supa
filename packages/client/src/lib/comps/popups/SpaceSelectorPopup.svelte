<script lang="ts">
  import { goto } from "$app/navigation";
  import {
    currentSpaceStore,
    spacePointersStore,
    currentSpaceIdStore,
    getCurrentSpacePointer,
  } from "$lib/spaces/spaceStore";
  import { Popover } from "@skeletonlabs/skeleton-svelte";
  import { openSpaces } from "$lib/spages";

  import { ChevronsUpDown } from "lucide-svelte";
  import { onMount } from "svelte";

  let openState = $state(false);

  let selectedSpaceId = $state<string | null>(null);

  onMount(() => {
    selectedSpaceId = $currentSpaceIdStore;
  });

  $effect(() => {
    $currentSpaceIdStore = selectedSpaceId;

    const currentPointer = getCurrentSpacePointer();
    if (currentPointer) {
      if (currentPointer.lastPageUrl) {
        goto(currentPointer.lastPageUrl);
      }
    } else {
      goto("/");
    }
  });
</script>

<Popover
  open={openState}
  onOpenChange={(e) => openState = e.open}
  positioning={{ placement: "bottom" }}
  triggerBase="flex-grow"
  contentBase="card bg-surface-100-900 p-2 space-y-2 max-w-[320px]"
  arrow
  arrowBackground="!bg-surface-100-900"
  closeOnInteractOutside={true}
  closeOnEscape={true}
>
  {#snippet trigger()}
    <div class="flex items-center gap-2">
      <ChevronsUpDown size={18} />
      <span class="flex-grow text-left">{$currentSpaceStore?.name}</span>
    </div>
  {/snippet}
  {#snippet content()}
    <div class="flex flex-col gap-1">
      {#each $spacePointersStore as pointer (pointer.id)}
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
      <button class="btn btn-sm w-full text-left justify-start" onclick={() => openSpaces()}>
        Manage spaces
      </button>
    </div>
  {/snippet}
</Popover>
