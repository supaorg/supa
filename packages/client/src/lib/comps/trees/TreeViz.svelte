<script lang="ts">
  import { writable } from "svelte/store";
  import type { ReplicatedTree } from "@core/replicatedTree/ReplicatedTree";
  import TreeBlockViz from "./TreeBlockViz.svelte";

  export let tree: ReplicatedTree;

  const treeStores = {
    dragStartVertexIdStore: writable<string | undefined>(undefined),
    dragOverVertexIdStore: writable<string | null | undefined>(undefined),
  }
</script>

<div style="margin-bottom: 20px;">
  <TreeBlockViz {tree} vertexId={tree.rootVertexId} {treeStores} />
</div>
