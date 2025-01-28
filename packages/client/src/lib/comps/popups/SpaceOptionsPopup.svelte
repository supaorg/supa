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

  function popoverClose() {
    openState = false;
  }

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
  bind:open={openState}
  positioning={{ placement: "bottom-end" }}
  triggerBase=""
  contentBase="card bg-surface-200-800 max-w-[320px]"
  arrow
  arrowBackground="!bg-surface-200 dark:!bg-surface-800"
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
      <button class="btn variant-filled-error w-full" onclick={handleRemove}>Remove from List</button>
    </div>
  {/snippet}
</Popover>
