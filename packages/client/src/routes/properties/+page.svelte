<script lang="ts">
  import { ReplicatedTree } from "@core/replicatedTree/ReplicatedTree";
  import { onMount } from "svelte";
  import TreeTestSyncWrapper from "$lib/comps/test-sync/TreeTestSyncWrapper.svelte";

  let trees: ReplicatedTree[] = [];

  onMount(() => {
    const t1 = new ReplicatedTree("peer1");

    const vertex = t1.newVertex(t1.rootVertexId);
    t1.setVertexProperty(vertex, "_n", "Vertex A");

    const t2 = new ReplicatedTree("peer2", t1.popLocalOps());

    t2.setVertexProperty(vertex, "_n", "Vertex B");
    t2.setVertexProperty(vertex, "test_num", 10.5);

    t1.setVertexProperty(vertex, "test_str", "yo, i'm a string");
    t1.setVertexProperty(vertex, "test_num", "yo not a number");

    t2.setVertexProperty(vertex, "test_num", 99);

    trees = [t1, t2];

    console.log(t1.compareStructure(t2));
    console.log(t1.printTree());
    console.log(t2.printTree());
  });
</script>

<TreeTestSyncWrapper {trees} />
