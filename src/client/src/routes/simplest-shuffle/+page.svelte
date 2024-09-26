<script lang="ts">
  import { ReplicatedTree } from "@shared/spaces/ReplicatedTree";
  import { type MoveNode } from "@shared/spaces/operations";
  import { OpId } from "@shared/spaces/OpId";
  import { onMount } from "svelte";

  let tree1: ReplicatedTree;

  let printedTree1: string;
  let printedTree2: string;
  let printedTree3: string;

  onMount(() => {
    const ops = [
      { id: new OpId(0, 'peer1'), targetId: 'R', parentId: null, prevParentId: null } as MoveNode,
      { id: new OpId(1, 'peer1'), targetId: 'A', parentId: 'R', prevParentId: null } as MoveNode,
      { id: new OpId(2, 'peer1'), targetId: 'B', parentId: 'A', prevParentId: null } as MoveNode,
    ];
    
    tree1 = new ReplicatedTree("peer1", ops);

    // Change the order of A and B
    const ops2 = [
      { id: new OpId(2, 'peer1'), targetId: 'B', parentId: 'A', prevParentId: null } as MoveNode,
      { id: new OpId(1, 'peer1'), targetId: 'A', parentId: 'R', prevParentId: null } as MoveNode,
      { id: new OpId(0, 'peer1'), targetId: 'R', parentId: null, prevParentId: null } as MoveNode,
    ];

    const tree2 = new ReplicatedTree("peer2", ops2);
  
    printedTree1 = tree1.printTree();
    printedTree2 = tree2.printTree();
  });
</script>

<div class="flex flex-col gap-4">
  <strong>Peer 1</strong>
  {#if printedTree1}
    <pre>{printedTree1}</pre>
  {/if}
</div>

<div class="flex flex-col gap-4">
  <strong>Peer 2 (shuffled copy)</strong>
  {#if printedTree2}
    <pre>{printedTree2}</pre>
  {/if}
</div>
