<script lang="ts">
  import { goto } from "$app/navigation";
  import {
    currentSpaceStore,
    spacePointersStore,
    currentSpaceIdStore,
    getCurrentSpacePointer,
  } from "$lib/spaces/spaceStore";
  import { Popover } from "@skeletonlabs/skeleton-svelte";

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
  contentBase="card bg-surface-200-800 p-2 space-y-4 max-w-[320px]"
  arrow
  arrowBackground="!bg-surface-200 dark:!bg-surface-800"
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
    {#if $spacePointersStore.length > 1}
      <select
        class="select rounded-container"
        size={$spacePointersStore.length}
        bind:value={selectedSpaceId}
      >
        {#each $spacePointersStore as pointer (pointer.id)}
          <option value={pointer.id}>{pointer.name || "Space"}</option>
        {/each}
      </select>
      <hr />
    {/if}

    <a href="/spaces" class="btn preset-filled-surface-500 w-full">Manage spaces</a>
  {/snippet}
</Popover>
