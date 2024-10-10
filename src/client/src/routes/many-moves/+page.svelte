<script lang="ts">
  import { ReplicatedTree } from "@shared/replicatedTree/ReplicatedTree";
  import { onMount } from "svelte";
  import TreeTestSyncWrapper from "$lib/comps/test-sync/TreeTestSyncWrapper.svelte";

  let tree1: ReplicatedTree;
  let tree2: ReplicatedTree;
  let trees: ReplicatedTree[] = [];

  function createTree1(tree: ReplicatedTree) {
    const nodeA = tree.newNode(null);
    const nodeB = tree.newNode(nodeA);
    const nodeC = tree.newNode(nodeB);
    const nodeD = tree.newNode(nodeA);
    const nodeE = tree.newNode(nodeD);
    const nodeF = tree.newNode(null);
    return { nodeA, nodeB, nodeC, nodeD, nodeE, nodeF };
  }

  function createTree2(tree: ReplicatedTree) {
    const nodeX = tree.newNode(null);
    const nodeY = tree.newNode(null);
    const nodeZ = tree.newNode(nodeX);
    const nodeW = tree.newNode(nodeY);
    const nodeV = tree.newNode(nodeW);
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

    compareTrees([tree1, tree2]);

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

    compareTrees([tree1, tree2]);

    trees = [tree1, tree2];

    console.log("🚀 Starting random moves...");
    randomMoves(trees, 100);
  });

  function randomMoves(trees: ReplicatedTree[], numMoves: number = 1000) {
    // Find a random node in the tree to move
    // Find a random new parent for that node
    // Move the node. We test both for legal and illegal moves

    for (let i = 0; i < numMoves; i++) {
      const tree = randomTree(trees);
      const targetChild = randomNotNullNode(tree);
      const newParent = randomNode(tree);
      tree.move(targetChild, newParent);
    }

    // Sync trees
    trees.forEach((tree) => {
      const ops = tree.popLocalOps();
      trees.forEach((t) => {
        if (t.peerId !== tree.peerId) {
          t.merge(ops);
        }
      });
    });

    compareTrees(trees);
  }

  function compareTrees(trees: ReplicatedTree[]) {
    const firstTree = trees[0];

    console.log(`🚀 Comparing ${trees.length} trees...`);

    const haveEqualMoveOps = trees.every((tree) => firstTree.compareMoveOps(tree));
    if (!haveEqualMoveOps) {
      console.error("❌ Trees have different move ops!");
    } else {
      console.log("✅ Trees have equal move ops!");
    }

    const haveEqualStructure = trees.every((tree) => firstTree.compareStructure(tree));
    if (!haveEqualStructure) {
      console.error("❌ Trees are not equal!");
    } else {
      console.log("✅ Trees are equal!");
    }
  }

  function randomNode(tree: ReplicatedTree) {
    const moves = tree.getMoveOps();
    const move = moves[Math.floor(Math.random() * moves.length)];
    
    // Get randomly targetId or parentId
    if (Math.random() < 0.5) {
      return move.targetId;
    } else {
      return move.parentId;
    }
  }

  function randomNotNullNode(tree: ReplicatedTree) {
    while (true) {
      const node = randomNode(tree);
      if (node !== null) {
        return node;
      }
    }
  }

  function randomTree(trees: ReplicatedTree[]) {
    return trees[Math.floor(Math.random() * trees.length)];
  }
  
</script>

<TreeTestSyncWrapper {trees} />
