<script lang="ts">
  import { ReplicatedTree } from "@shared/spaces/ReplicatedTree";
  import { onMount } from "svelte";

  let tree: ReplicatedTree;

  let printedTree1: string;
  let printedTree2: string;
  let printedTree3: string;

  onMount(() => {
    tree = new ReplicatedTree("peer1");

    const nodeA = tree.newNode(null);
    const nodeB = tree.newNode(null);
    const nodeC = tree.newNode(null);
    const nodeD = tree.newNode(nodeC);
    tree.move(nodeC, nodeA);
    tree.move(nodeB, nodeD);
    tree.move(nodeA, nodeD);
    const nodeE = tree.newNode(null);

    const ops1 = tree.popLocalOps();

    tree.move(nodeD, nodeE);

    const ops2 = tree.popLocalOps();

    // Apply the same operations to a new tree
    const tree2 = new ReplicatedTree("peer2", ops1);

    const nodeF = tree2.newNode(nodeD);

    tree2.merge(ops2);

    const ops3 = tree2.popLocalOps();

    tree.merge(ops3);

    // Shuffle the operations and apply them to a new tree
    const shaffledOps = [...tree.getMoveOps()].sort(() => Math.random() - 0.5);
    const tree3 = new ReplicatedTree("peer3", shaffledOps);

    console.log(tree.compareStructure(tree2)); // true
    console.log(tree.compareStructure(tree3)); // false
  
    printedTree1 = tree.printTree();
    printedTree2 = tree2.printTree();
    printedTree3 = tree3.printTree();
  });
</script>

<div class="flex flex-col gap-4">
  <strong>Peer 1</strong>
  {#if printedTree1}
    <pre>{printedTree1}</pre>
  {/if}
</div>

<div class="flex flex-col gap-4">
  <strong>Peer 2 (direct copy)</strong>
  {#if printedTree2}
    <pre>{printedTree2}</pre>
  {/if}
</div>

<div class="flex flex-col gap-4">
  <strong>Peer 3 (shuffled copy)</strong>
  {#if printedTree3}
    <pre>{printedTree3}</pre>
  {/if}
</div>
