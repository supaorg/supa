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
