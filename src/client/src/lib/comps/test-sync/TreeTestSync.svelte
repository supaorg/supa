<script lang="ts">
  import { ReplicatedTree } from "@shared/replicatedTree/ReplicatedTree";
  import TreeViz from "../trees/TreeViz.svelte";

  export let tree: ReplicatedTree;
  export let onDuplicate: (tree: ReplicatedTree) => void;
  export let onDelete: (tree: ReplicatedTree) => void;

  function createNode() {
    tree.newNode(tree.rootNodeId);
  }

  function duplicateTree() {
    onDuplicate(tree);
  }

  function deleteTree() {
    onDelete(tree);
  }
</script>

<div class="relative card p-4">
  <strong>Peer ID: {tree.peerId}</strong>
  <button class="btn-sm variant-filled absolute top-0 right-0" on:click={deleteTree}>╳</button>
  <TreeViz {tree} />
  <div class="flex flex-col gap-2">
    <button class="btn variant-filled" on:click={createNode}>Create a node</button>
    <button class="btn variant-filled" on:click={duplicateTree}>Duplicate Tree</button>
  </div>
</div>
