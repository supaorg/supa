<script lang="ts">
  import { ReplicatedTree } from "@shared/spaces/ReplicatedTree";
  import TreeTestSync from "./TreeTestSync.svelte";

  export let trees: ReplicatedTree[];

  function syncTrees() {
    trees.forEach((tree) => {
      const ops = tree.popLocalMoveOps();

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
  }
</script>

<div>
  {#each trees as tree}
    <TreeTestSync {tree} />
  {/each}
</div>
<button on:click={syncTrees} type="button" class="btn preset-filled">Sync Trees</button>
