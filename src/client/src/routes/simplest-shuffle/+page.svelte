<script lang="ts">
  import { ReplicatedTree } from "@shared/spaces/ReplicatedTree";
  import { type MoveNode } from "@shared/spaces/operations";
  import { OpId } from "@shared/spaces/OpId";
  import { onMount } from "svelte";
  import TreeTestSyncWrapper from "$lib/comps/test-sync/TreeTestSyncWrapper.svelte";

  let trees: ReplicatedTree[] = [];

  onMount(() => {
    const ops = [
      { id: new OpId(0, 'peer1'), targetId: 'R', parentId: null, prevParentId: undefined } as MoveNode,
      { id: new OpId(1, 'peer1'), targetId: 'A', parentId: 'R', prevParentId: null } as MoveNode,
      { id: new OpId(2, 'peer1'), targetId: 'B', parentId: 'A', prevParentId: null } as MoveNode,
    ];
    
    const t1 = new ReplicatedTree("peer1", ops);

    // Change the order of A and B
    const ops2 = [
      { id: new OpId(2, 'peer1'), targetId: 'B', parentId: 'A', prevParentId: null } as MoveNode,
      { id: new OpId(1, 'peer1'), targetId: 'A', parentId: 'R', prevParentId: null } as MoveNode,
      { id: new OpId(0, 'peer1'), targetId: 'R', parentId: null, prevParentId: undefined } as MoveNode,
    ];

    const t2 = new ReplicatedTree("peer2", ops2);

    trees = [t1, t2];

    console.log(t1.compareStructure(t2));

    console.log(t1.printTree());
    console.log(t2.printTree());
  });
</script>

<TreeTestSyncWrapper {trees} />
