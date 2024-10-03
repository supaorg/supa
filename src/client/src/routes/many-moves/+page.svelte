<script lang="ts">
  import { ReplicatedTree } from "@shared/spaces/ReplicatedTree";
  import { type MoveNode, printMoveOps } from "@shared/spaces/operations";
  import { onMount } from "svelte";
  import TreeTestSyncWrapper from "$lib/comps/test-sync/TreeTestSyncWrapper.svelte";

  let tree1: ReplicatedTree;
  let tree2: ReplicatedTree;
  let trees: ReplicatedTree[] = [];

  function createTree1(tree: ReplicatedTree) {
    const nodeA = tree.newIn(null);
    const nodeB = tree.newIn(nodeA);
    const nodeC = tree.newIn(nodeB);
    const nodeD = tree.newIn(nodeA);
    const nodeE = tree.newIn(nodeD);
    const nodeF = tree.newIn(null);
    return { nodeA, nodeB, nodeC, nodeD, nodeE, nodeF };
  }

  function createTree2(tree: ReplicatedTree) {
    const nodeX = tree.newIn(null);
    const nodeY = tree.newIn(null);
    const nodeZ = tree.newIn(nodeX);
    const nodeW = tree.newIn(nodeY);
    const nodeV = tree.newIn(nodeW);
    return { nodeX, nodeY, nodeZ, nodeW, nodeV };
  }

  onMount(() => {
    tree1 = new ReplicatedTree("peer1");
    tree2 = new ReplicatedTree("peer2");

    // Create different tree structures
    const nodes1 = createTree1(tree1);
    const nodes2 = createTree2(tree2);

    // Merge results
    tree1.merge(tree2.getMoveOps());
    tree2.merge(tree1.getMoveOps());

    console.log("Compare trees after merging 1", tree1.compareStructure(tree2));

    // Manipulate trees independently
    // Tree 1: Move nodeC under nodeF (changing its parent)
    tree1.move(nodes1.nodeC, nodes1.nodeF);
    // Tree 1: Move nodeE to root
    tree1.move(nodes1.nodeE, null);

    // Tree 2: Move nodeZ under nodeV (potential conflict if merged with tree1)
    tree2.move(nodes2.nodeZ, nodes2.nodeV);
    // Tree 2: Move nodeX under nodeW (creating a cycle)
    tree2.move(nodes2.nodeX, nodes2.nodeW);

    // Merge again
    tree1.merge(tree2.getMoveOps());
    tree2.merge(tree1.getMoveOps());

    console.log("Compare trees after merging 2", tree1.compareStructure(tree2));

    trees = [tree1, tree2];
  });
</script>

<TreeTestSyncWrapper {trees} />
