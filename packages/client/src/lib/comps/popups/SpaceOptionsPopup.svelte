<script lang="ts">
  import { MoreVertical } from "lucide-svelte";
  import { Popover } from "@skeletonlabs/skeleton-svelte";

  let { 
    onRename = () => {},
    onRemove = () => {},
  }: { 
    onRename: () => void;
    onRemove: () => void;
  } = $props();
  let openState = $state(false);

  function handleRename() {
    openState = false;
    onRename();
  }

  function handleRemove() {
    openState = false;
    onRemove();
  }
</script>

<Popover
  open={openState}
  onOpenChange={(e) => openState = e.open}
  positioning={{ placement: "bottom-end" }}
  triggerBase=""
  contentBase="card bg-surface-200-800 max-w-[320px]"
  arrow
  arrowBackground="!bg-surface-200 dark:!bg-surface-800"
  closeOnInteractOutside={true}
  closeOnEscape={true}
>
  {#snippet trigger()}
    <button class="btn-icon variant-soft">
      <MoreVertical size={18} />
    </button>
  {/snippet}

  {#snippet content()}
    <div class="">
      <button class="btn preset-filled-surface-500 w-full" onclick={handleRename}>Rename</button>
      <!--<button class="btn preset-filled-surface-500 w-full">Reveal in Finder</button>-->
      <button class="btn preset-filled-error w-full" onclick={handleRemove}>Remove from List</button>
    </div>
  {/snippet}
</Popover>
