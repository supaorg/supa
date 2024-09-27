<script lang="ts">
  import { writable } from "svelte/store";
  import type { ReplicatedTree } from "@shared/spaces/ReplicatedTree";
  import TreeBlockViz from "./TreeBlockViz.svelte";

  export let tree: ReplicatedTree;

  const treeStores = {
    dragStartNodeIdStore: writable<string | null>(null),
    dragOverNodeIdStore: writable<string | null>(null),
  }
</script>

<div style="margin-bottom: 20px;">
  <TreeBlockViz {tree} nodeId={tree.rootId} {treeStores} />
</div>