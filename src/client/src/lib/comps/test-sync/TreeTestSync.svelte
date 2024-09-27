<script lang="ts">
  import { ReplicatedTree } from "@shared/spaces/ReplicatedTree";
    import TreeViz from "../trees/TreeViz.svelte";

  export let tree: ReplicatedTree;
</script>

<div>
  <TreeViz {tree} />
</div>