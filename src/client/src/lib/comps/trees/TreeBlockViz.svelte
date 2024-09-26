<script lang="ts">
  import { onMount } from "svelte";
  import type { ReplicatedTree, TreeNode } from "@shared/spaces/ReplicatedTree";

  export let tree: ReplicatedTree;
  export let nodeId: string;

  let children: TreeNode[] = [];
  let isRoot: boolean;

  onMount(() => {
    children = tree.getChildren(nodeId);
    isRoot = nodeId === tree.rootId;
  });
</script>

<div style={isRoot ? '' : 'margin-left: 20px;'}>
  <div>{nodeId}</div>
  
  {#each children as child (child.id)}
    <svelte:self {tree} nodeId={child.id} />
  {/each}
</div>
