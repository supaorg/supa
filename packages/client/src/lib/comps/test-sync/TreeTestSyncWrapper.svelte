<script lang="ts">
  import { ReplicatedTree } from "@core/replicatedTree/ReplicatedTree";
  import TreeTestSync from "./TreeTestSync.svelte";
  import uuid from "@core/uuid/uuid";

  export let trees: ReplicatedTree[];

  function handleDuplicate(tree: ReplicatedTree) {
    const newTree = new ReplicatedTree(uuid() + '_duplicate', tree.getAllOps());
    
    // Insert the new tree after the target tree
    const index = trees.findIndex((t) => t.peerId === tree.peerId);
    trees.splice(index + 1, 0, newTree);

    trees = [...trees];
  }

  function handleDelete(tree: ReplicatedTree) {
    trees = trees.filter((t) => t.peerId !== tree.peerId);
  }

  function syncTrees() {
    if (trees.length < 2) {
      console.error("⛔️ Need at least 2 trees to sync!");
      return;
    }

    trees.forEach((tree) => {
      const ops = tree.popLocalOps();

      trees.forEach((t) => {
        if (t.peerId !== tree.peerId) {
          t.merge(ops);
        }
      });
    });

    for (let i = 0; i < trees.length; i++) {
      for (let j = i + 1; j < trees.length; j++) {
        const tree1 = trees[i];
        const tree2 = trees[j];

        const haveEqualMoveOps = tree1.compareMoveOps(tree2);
        if (haveEqualMoveOps) {
          console.log(`✅ Trees ${i} and ${j} have equal move ops`);
        } else {
          console.error(`❌ Trees ${i} and ${j} have different move ops`);
        }

        const haveEqualStructure = tree1.compareStructure(tree2);
        if (haveEqualStructure) {
          console.log(`✅ Trees ${i} and ${j} have equal structure`);
        } else {
          console.error(`❌ Trees ${i} and ${j} have different structure`);
        }

        console.log(`Tree ${i}:`);
        console.log(tree1.printTree());
        console.log(`Tree ${j}:`);
        console.log(tree2.printTree());
      }
    }
  }
</script>

<div class="flex flex-col gap-4">
  {#each trees as tree (tree.peerId)}
    <TreeTestSync {tree} onDuplicate={handleDuplicate} onDelete={handleDelete} />
  {/each}
  <button on:click={syncTrees} type="button" class="btn preset-filled-primary"
    >Sync Trees</button
  >
</div>
