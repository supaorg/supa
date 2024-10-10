<script lang="ts">
  import { writable } from "svelte/store";
  import type { ReplicatedTree } from "@shared/replicatedTree/ReplicatedTree";
  import TreeBlockViz from "./TreeBlockViz.svelte";

  export let tree: ReplicatedTree;

  const treeStores = {
    dragStartNodeIdStore: writable<string | undefined>(undefined),
    dragOverNodeIdStore: writable<string | null | undefined>(undefined),
  }
</script>

<div style="margin-bottom: 20px;">
  <TreeBlockViz {tree} nodeId={tree.rootNodeId} {treeStores} />
</div>
