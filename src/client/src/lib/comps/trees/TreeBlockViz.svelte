<script lang="ts">
  import { onMount } from "svelte";
  import type { ReplicatedTree, TreeNode } from "@shared/spaces/ReplicatedTree";

  export let tree: ReplicatedTree;
  export let nodeId: string;

  let children: TreeNode[] = [];
  let isRoot: boolean;
  let isExpanded = true;

  onMount(() => {
    children = tree.getChildren(nodeId);
    isRoot = nodeId === tree.rootId;
  });

  function toggleExpand() {
    isExpanded = !isExpanded;
  }
</script>

<div class="tree-item" class:ml-4={!isRoot}>
  <button
    class="tree-item-summary w-full text-left list-none flex items-center cursor-pointer space-x-4 rounded-container-token py-4 px-4 hover:variant-soft"
    on:click={toggleExpand}
    aria-expanded={isExpanded}
    type="button"
  >
    <div class="tree-summary-symbol fill-current w-3 text-center transition-transform duration-[200ms]" class:rotate-180={isExpanded}>
      {#if children.length > 0}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
          <path d="M201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"></path>
        </svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-3 opacity-10">
          <path d="M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"></path>
        </svg>
      {/if}
    </div>
    <span class="tree-item-content">{nodeId}</span>
  </button>

  {#if isExpanded && children.length > 0}
    <div class="tree-item-children ml-4" role="group">
      {#each children as child (child.id)}
        <svelte:self {tree} nodeId={child.id} />
      {/each}
    </div>
  {/if}
</div>
