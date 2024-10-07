<script lang="ts">
  import { ReplicatedTree } from "@shared/replicatedTree/ReplicatedTree";
  import TreeTestSync from "./TreeTestSync.svelte";

  export let trees: ReplicatedTree[];

  function syncTrees() {
    trees.forEach((tree) => {
      const ops = tree.popLocalOps();

      trees.forEach((t) => {
        if (t.peerId !== tree.peerId) {
          t.merge(ops);
        }
      });
    });

    const firstTree = trees[0];
    const allAreEqual = trees.every((tree) => firstTree.compareStructure(tree));
    if (!allAreEqual) {
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
