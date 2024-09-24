<script lang="ts">
  import { ReplicatedTree } from "@shared/spaces/replicatedTree";
  import { onMount } from "svelte";

  let tree: ReplicatedTree;

  let printedTree: string;

  onMount(() => {
    tree = new ReplicatedTree('peer1');

    const nodeA = tree.new(tree.rootId);
    const nodeB = tree.new(tree.rootId);
    const nodeC = tree.new(tree.rootId);
    const nodeD = tree.new(nodeC);

    tree.move(nodeC, nodeA);
    tree.move(nodeB, nodeD);
    tree.move(nodeA, nodeD);

    const nodeE = tree.new(tree.rootId);
    
    printedTree = tree.printTree();
  });
</script>

{#if printedTree}
  <pre>{printedTree}</pre>
{/if}

