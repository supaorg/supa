<script lang="ts">
  import { onMount } from "svelte";
  import { writable, type Writable, get } from "svelte/store";
  import type { ReplicatedTree, TreeNode } from "@shared/spaces/ReplicatedTree";

  export let tree: ReplicatedTree;
  export let nodeId: string;
  export let treeStores: {
    dragStartNodeIdStore: Writable<string | null>;
    dragOverNodeIdStore: Writable<string | null>;
  };

  let children: TreeNode[] = [];
  let isRoot: boolean;
  let isExpanded = false;
  let highlightAsDragOver = false;

  // TODO: detect illigal moves and show it (or at least don't higlight the node when it's not allowed to move a node in)

  $: {
    isRoot = nodeId === tree.rootId;
    highlightAsDragOver = nodeId === get(treeStores.dragOverNodeIdStore);
  }

  onMount(() => {
    // TODO: make it possible to subscribe to changes in children and update them
    children = tree.getChildren(nodeId);
  });

  function toggleExpand() {
    isExpanded = !isExpanded;
  }

  function handleDragStart(event: DragEvent, id: string) {
    event.stopPropagation();
    treeStores.dragStartNodeIdStore.set(id);
    console.log(
      `Started dragging node: ${get(treeStores.dragStartNodeIdStore)}`,
    );
  }

  function handleDragOver(event: DragEvent, id: string) {
    event.preventDefault();
    treeStores.dragOverNodeIdStore.set(id);
  }

  function handleDragLeave() {
    treeStores.dragOverNodeIdStore.set(null);
  }

  function handleDrop(event: DragEvent, targetId: string) {
    event.preventDefault();
    event.stopPropagation();

    let draggedNodeId = get(treeStores.dragStartNodeIdStore);

    console.log(
      `Drop event triggered. draggedNodeId: ${draggedNodeId}, targetId: ${targetId}`,
    );

    if (!draggedNodeId) {
      console.log("Drop action invalid: draggedNodeId is null");
    } else if (draggedNodeId === targetId) {
      console.log(
        `Dropped node ${draggedNodeId} onto itself - no action taken`,
      );
    } else {
      console.log(`Attempting to move node ${draggedNodeId} to ${targetId}`);
      try {
        tree.move(draggedNodeId, targetId);
        console.log("Move successful");

        // Refresh the children list
        children = tree.getChildren(nodeId);

        // If the current node is the target, expand it to show the new child
        if (nodeId === targetId) {
          isExpanded = true;
        }
      } catch (error) {
        console.error("Error during tree.move:", error);
      }
    }

    treeStores.dragStartNodeIdStore.set(null);
    treeStores.dragOverNodeIdStore.set(null);
  }
</script>

<div
  class="tree-item"
  class:ml-4={!isRoot}
  class:drag-over={highlightAsDragOver}
  draggable="true"
  role="treeitem"
  tabindex="0"
  aria-selected="false"
  on:dragstart={(e) => handleDragStart(e, nodeId)}
  on:dragover={(e) => handleDragOver(e, nodeId)}
  on:dragleave={handleDragLeave}
  on:drop={(e) => handleDrop(e, nodeId)}
>
  <button
    class="tree-item-summary w-full text-left list-none flex items-center cursor-pointer space-x-4 rounded-container-token py-4 px-4 hover:variant-soft"
    on:click={toggleExpand}
    aria-expanded={isExpanded}
    type="button"
  >
    <div
      class="tree-summary-symbol fill-current w-3 text-center transition-transform duration-[200ms]"
      class:rotate-180={isExpanded}
    >
      {#if children.length > 0}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
          <path
            d="M201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"
          ></path>
        </svg>
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
          class="w-3 opacity-10"
        >
          <path
            d="M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"
          ></path>
        </svg>
      {/if}
    </div>
    <span class="tree-item-content">{nodeId}</span>
  </button>

  {#if isExpanded && children.length > 0}
    <div class="tree-item-children ml-4" role="group">
      {#each children as child (child.id)}
        <svelte:self {tree} nodeId={child.id} {treeStores} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .drag-over {
    background-color: rgba(0, 0, 255, 0.1);
    outline: 2px solid blue;
  }
</style>
