<script lang="ts">
  import { ReplicatedTree } from "@shared/replicatedTree/ReplicatedTree";
  import TreeTestSync from "./TreeTestSync.svelte";

  export let trees: ReplicatedTree[];

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

    const firstTree = trees[0];


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

    console.log(firstTree.printTree());
    console.log(trees[1].printTree());
  }
</script>

<div class="flex flex-col gap-4">
  {#each trees as tree}
    <TreeTestSync {tree} />
  {/each}
  <button on:click={syncTrees} type="button" class="btn variant-filled-primary"
    >Sync Trees</button
  >
</div>
