<script lang="ts">
  import { ReplicatedTree } from "@core/replicatedTree/ReplicatedTree";
  import TreeViz from "../trees/TreeViz.svelte";

  export let tree: ReplicatedTree;
  export let onDuplicate: (tree: ReplicatedTree) => void;
  export let onDelete: (tree: ReplicatedTree) => void;

  function createVertex() {
    tree.newVertex(tree.rootVertexId);
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
  <button class="btn-sm preset-filled-surface-500 absolute top-0 right-0" on:click={deleteTree}>╳</button>
  <TreeViz {tree} />
  <div class="flex flex-col gap-2">
    <button class="btn preset-filled-surface-500" on:click={createVertex}>Create a vertex</button>
    <button class="btn preset-filled-surface-500" on:click={duplicateTree}>Duplicate Tree</button>
  </div>
</div>
