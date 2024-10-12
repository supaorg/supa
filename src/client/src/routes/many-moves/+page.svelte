<script lang="ts">
  import { ReplicatedTree } from "@shared/replicatedTree/ReplicatedTree";
  import { onMount } from "svelte";
  import TreeTestSyncWrapper from "$lib/comps/test-sync/TreeTestSyncWrapper.svelte";
  import { fuzzyTest } from "@shared/replicatedTree/fuzzyTests";

  let trees: ReplicatedTree[] = [];

  onMount(() => {
    try {
      trees = fuzzyTest(3, 100, 100);
    } catch (error) {
      console.error(error);
    }

    /*
    tree1 = new ReplicatedTree("peer1");
    tree2 = new ReplicatedTree("peer2", tree1.getMoveOps());

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
    tree1.move(nodes1.nodeE, tree1.rootNodeId);

    // Tree 2: Move nodeZ under nodeV (potential conflict if merged with tree1)
    tree2.move(nodes2.nodeZ, nodes2.nodeV);
    // Tree 2: Move nodeX under nodeW (creating a cycle)
    tree2.move(nodes2.nodeX, nodes2.nodeW);

    // Merge again
    tree1.merge(tree2.getMoveOps());
    tree2.merge(tree1.getMoveOps());

    const shuffledMoveOps = [...tree1.getMoveOps()].sort(
      () => Math.random() - 0.5,
    );
    const tree3 = new ReplicatedTree("peer3", shuffledMoveOps);

    compareTrees([tree1, tree2, tree3]);

    trees = [tree1, tree2, tree3];

    const tries = 10;

    for (let i = 0; i < tries; i++) {
      console.log(`🚀 Running ${i + 1} of ${tries}...`);
      randomMoves(trees, 1000);
    }
      */
  });

  type RandomAction = "move" | "create";

  function randomMoves(trees: ReplicatedTree[], numMoves: number = 1000) {
    console.log(`🧪 Starting ${numMoves} random moves...`);

    // Find a random node in the tree to move
    // Find a random new parent for that node
    // Move the node. We test both for legal and illegal moves

    const chanceOfCreate = 0.025;
    const chanceOfMoveInANonExistingParent = 0.01;

    for (let i = 0; i < numMoves; i++) {
      const action: RandomAction =
        Math.random() < chanceOfCreate ? "create" : "move";

      if (action === "create") {
        const tree = randomTree(trees);
        tree.newNode(randomNode(tree));
      } else {
        const tree = randomTree(trees);
        const targetChild = randomNode(tree);

        let newParent: string;
        if (Math.random() < chanceOfMoveInANonExistingParent) {
          newParent = Math.random().toString(36).substring(2, 8);
        } else {
          newParent = randomNode(tree);
        }

        tree.move(targetChild, newParent);
      }
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

    //treesForViz = [...trees];
  }

  function compareTrees(trees: ReplicatedTree[]) {
    const firstTree = trees[0];

    console.log(`🚀 Comparing ${trees.length} trees...`);

    const haveEqualMoveOps = trees.every((tree) =>
      firstTree.compareMoveOps(tree),
    );
    if (!haveEqualMoveOps) {
      console.error("❌ Trees have different move ops!");
    } else {
      console.log("✅ Trees have equal move ops!");
    }

    const haveEqualStructure = trees.every((tree) =>
      firstTree.compareStructure(tree),
    );
    if (!haveEqualStructure) {
      console.error("❌ Trees are not equal!");
    } else {
      console.log("✅ Trees are equal!");
    }
  }

  function randomNode(tree: ReplicatedTree) {
    const nodes = tree.getAllNodes(); // Assuming you add this method to ReplicatedTree
    const randomIndex = Math.floor(Math.random() * nodes.length);
    return nodes[randomIndex].id;
  }

  function randomTree(trees: ReplicatedTree[]) {
    return trees[Math.floor(Math.random() * trees.length)];
  }
</script>

<TreeTestSyncWrapper {trees} />
