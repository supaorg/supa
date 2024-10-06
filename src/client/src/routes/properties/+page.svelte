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
    t1.setNodeProperty(node, "_n", "Node A");

    const t2 = new ReplicatedTree("peer2", t1.popLocalOps());

    t2.setNodeProperty(node, "_n", "Node B");
    t2.setNodeProperty(node, "test_num", 10.5);

    t1.setNodeProperty(node, "test_str", "yo, i'm a string");
    t1.setNodeProperty(node, "test_num", "yo not a number");

    t2.setNodeProperty(node, "test_num", 99);

    trees = [t1, t2];

    console.log(t1.compareStructure(t2));
    console.log(t1.printTree());
    console.log(t2.printTree());
  });
</script>

<TreeTestSyncWrapper {trees} />
