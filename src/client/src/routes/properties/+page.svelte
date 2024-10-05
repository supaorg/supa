<script lang="ts">
  import { ReplicatedTree } from "@shared/spaces/ReplicatedTree";
  import { type MoveNode } from "@shared/spaces/operations";
  import { OpId } from "@shared/spaces/OpId";
  import { onMount } from "svelte";
  import TreeTestSyncWrapper from "$lib/comps/test-sync/TreeTestSyncWrapper.svelte";

  let trees: ReplicatedTree[] = [];

  onMount(() => {
    const t1 = new ReplicatedTree("peer1");

    const node = t1.newNode();
    t1.setNodeProperty(node, "name", "Node A");
    console.log(t1.getNodeProperty(node, "name"));
    console.log(t1.getNodeProperties(node));

    const t2 = new ReplicatedTree("peer2", t1.popLocalOps());

    t2.setNodeProperty(node, "name", "Node B");
    console.log(t2.getNodeProperty(node, "name"));
    console.log(t2.getNodeProperties(node));

    trees = [t1, t2];

    console.log(t1.compareStructure(t2));
    console.log(t1.printTree());
    console.log(t2.printTree());
  });
</script>

<TreeTestSyncWrapper {trees} />
