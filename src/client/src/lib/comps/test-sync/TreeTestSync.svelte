<script lang="ts">
  import { ReplicatedTree } from "@shared/replicatedTree/ReplicatedTree";
  import TreeViz from "../trees/TreeViz.svelte";

  export let tree: ReplicatedTree;

  function createNode() {
    tree.newNode();
  }
</script>

<div class="card p-4">
  <TreeViz {tree} />
  <button class="btn variant-filled" on:click={createNode}>Create a node</button>
</div>
