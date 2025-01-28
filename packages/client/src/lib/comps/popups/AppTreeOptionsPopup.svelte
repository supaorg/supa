<script lang="ts">
  import { EllipsisVertical } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { Popover } from "@skeletonlabs/skeleton-svelte";
  import { currentSpaceStore } from "$lib/spaces/spaceStore";

  let { appTreeId }: { appTreeId: string } = $props();
  let openState = $state(false);

  function popoverClose() {
    openState = false;
  }

  function startRenamingThread() {
    // @TODO: trigger renaming
    popoverClose();
  }

  async function deleteThread() {
    $currentSpaceStore?.deleteAppTree(appTreeId);
    goto("/");
    popoverClose();
  }
</script>

<div class="flex justify-center items-center mt-1 mr-2">
  <Popover
    bind:open={openState}
    positioning={{ placement: "bottom" }}
    triggerBase=""
    contentBase="card bg-surface-200-800 p-4 space-y-4 max-w-[320px]"
    arrow
    arrowBackground="!bg-surface-200 dark:!bg-surface-800"
  >
    {#snippet trigger()}
      <EllipsisVertical size={18} />
    {/snippet}

    {#snippet content()}
      <div class="btn-group-vertical preset-filled-surface-500">
        <button class="btn preset-filled-surface-500" onclick={deleteThread}>Delete</button
        >
      </div>
    {/snippet}
  </Popover>
</div>
