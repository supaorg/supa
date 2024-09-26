<script lang="ts">
  import type { ReplicatedTree } from "@shared/spaces/ReplicatedTree";
  import TreeBlockViz from "./TreeBlockViz.svelte";

  export let tree: ReplicatedTree;
</script>

<div style="margin-bottom: 20px;">
  <TreeBlockViz {tree} nodeId={tree.rootId} />
</div>

