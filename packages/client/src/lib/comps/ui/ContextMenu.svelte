<script lang="ts">
  import { Popover } from "@skeletonlabs/skeleton-svelte";
  import type { Snippet } from "svelte";

  let {
    open = false,
    onOpenChange,
    placement = "bottom",
    closeOnInteractOutside = true,
    closeOnEscape = true,
    triggerClassNames = "",
    maxWidth = "320px",
    content,
    trigger,
    arrow = true,
  }: {
    open: boolean;
    onOpenChange: (e: { open: boolean }) => void;
    placement?: "top" | "right" | "bottom" | "left";
    closeOnInteractOutside?: boolean;
    closeOnEscape?: boolean;
    triggerClassNames?: string;
    maxWidth?: string;
    content: Snippet<[]>;
    trigger: Snippet<[]>;
    arrow?: boolean;
  } = $props();
</script>

<Popover
  zIndex="50"
  {open}
  {onOpenChange}
  positioning={{ placement }}
  triggerBase={`${triggerClassNames}`}
  contentBase={`card bg-surface-100-900 p-2 space-y-2 max-w-[${maxWidth}]`}
  {arrow}
  arrowBackground="!bg-surface-100-900"
  {closeOnInteractOutside}
  {closeOnEscape}
>
  {#snippet trigger()}
    {#if trigger}
      {@render trigger()}
    {/if}
  {/snippet}
  
  {#snippet content()}
    {#if content}
      {@render content()}
    {/if}
  {/snippet}
</Popover> 