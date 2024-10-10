<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { type Writable, get } from "svelte/store";
  import type { ReplicatedTree } from "@shared/replicatedTree/ReplicatedTree";
  import {
    TreeNode,
    type NodeChangeEvent,
    type TreeNodeProperty,
  } from "@shared/replicatedTree/treeTypes";

  export let tree: ReplicatedTree;
  export let nodeId: string;
  export let treeStores: {
    dragStartNodeIdStore: Writable<string | undefined>;
    dragOverNodeIdStore: Writable<string | null | undefined>;
  };

  let children: TreeNode[] = [];
  let properties: ReadonlyArray<TreeNodeProperty> = [];
  let nodeName: string | null = null;
  let isRoot: boolean;
  let isExpanded = false;
  let highlightAsDragOver = false;

  // TODO: detect illigal moves and show it (or at least don't higlight the node when it's not allowed to move a node in)

  treeStores.dragOverNodeIdStore.subscribe((id) => {
    highlightAsDragOver = nodeId === id;
  });

  function updateChildren() {
    children = tree.getChildren(nodeId);

    if (nodeId) {
      properties = tree.getNodeProperties(nodeId);
      nodeName = properties.find((p) => p.key === "_n")?.value as string | null;
    }
  }

  function handleTreeChange(event: NodeChangeEvent) {
    console.log("peerId", tree.peerId);

    if (event.type === 'property') {
      console.log("property change", event);
    } else if (event.type === 'children') {
      console.log("children change", event);
    } else if (event.type === 'move') {
      console.log("move change", event);
    }

    /*
    // Update the children if the node has updated or one of its children has updated
    if (event.nodeId === nodeId) {
      updateChildren();
    }
      */

    updateChildren();
  }

  onMount(() => {
    isRoot = nodeId === tree.rootNodeId;
    updateChildren();
    tree.subscribe(nodeId, handleTreeChange);
  });

  onDestroy(() => {
    tree.unsubscribe(nodeId,handleTreeChange);
  });

  function toggleExpand() {
    isExpanded = !isExpanded;
  }

  function handleDragStart(event: DragEvent) {
    if (!nodeId) {
      return;
    }

    event.stopPropagation();
    treeStores.dragStartNodeIdStore.set(nodeId);
    console.log(
      `Started dragging node: ${get(treeStores.dragStartNodeIdStore)}`,
    );
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    treeStores.dragOverNodeIdStore.set(nodeId);
  }

  function handleDragLeave() {
    treeStores.dragOverNodeIdStore.set(null);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    let draggedNodeId = get(treeStores.dragStartNodeIdStore);

    console.log(
      `Drop event triggered. draggedNodeId: ${draggedNodeId}, targetId: ${nodeId}`,
    );

    if (!draggedNodeId) {
      console.log("Drop action invalid: draggedNodeId is null");
    } else if (draggedNodeId === nodeId) {
      console.log(
        `Dropped node ${draggedNodeId} onto itself - no action taken`,
      );
    } else {
      console.log(`Attempting to move node ${draggedNodeId} to ${nodeId}`);
      try {
        tree.move(draggedNodeId, nodeId);
        console.log("Move successful");
        isExpanded = true;
      } catch (error) {
        console.error("Error during tree.move:", error);
      }
    }

    treeStores.dragStartNodeIdStore.set(undefined);
    treeStores.dragOverNodeIdStore.set(undefined);
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
  on:dragstart={(e) => handleDragStart(e)}
  on:dragover={(e) => handleDragOver(e)}
  on:dragleave={handleDragLeave}
  on:drop={(e) => handleDrop(e)}
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
    <div class="tree-item-content">
      <span>
        {#if nodeName}
          {nodeName}
        {:else}
          {nodeId ?? "root"}
        {/if}
      </span>
      <ul class="text-xs">
        {#each properties as property}
          <li>{property.key}: {property.value}</li>
        {/each}
      </ul>
    </div>
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
