<script lang="ts">
  import { EllipsisVertical } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import ContextMenu from "$lib/comps/ui/ContextMenu.svelte";
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
  <ContextMenu
    open={openState}
    onOpenChange={(e) => openState = e.open}
    placement="bottom"
    triggerClassNames=""
  >
    {#snippet trigger()}
      <EllipsisVertical size={14} />
    {/snippet}

    {#snippet content()}
      <div class="btn-group-vertical preset-filled-surface-500">
        <button class="btn preset-filled-surface-500" onclick={deleteThread}>Delete</button>
      </div>
    {/snippet}
  </ContextMenu>
</div>
