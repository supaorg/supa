<script lang="ts">
  import { ReplicatedTree } from "@shared/replicatedTree/ReplicatedTree";
  import { type MoveNode } from "@shared/replicatedTree/operations";
  import { OpId } from "@shared/replicatedTree/OpId";
  import { onMount } from "svelte";

  let tree1: ReplicatedTree;

  let printedTree1: string;
  let printedTree2: string;
  let printedTree3: string;

  onMount(() => {
    const ops = [
      { id: new OpId(0, 'peer1'), targetId: 'R', parentId: null } as MoveNode,
      { id: new OpId(1, 'peer1'), targetId: 'A', parentId: 'R' } as MoveNode,
      { id: new OpId(2, 'peer1'), targetId: 'B', parentId: 'R' } as MoveNode,
      { id: new OpId(3, 'peer1'), targetId: 'B', parentId: 'A' } as MoveNode,
      { id: new OpId(3, 'peer2'), targetId: 'A', parentId: 'B' } as MoveNode,
    ];
    
    tree1 = new ReplicatedTree("peer1", ops);

    const ops2 = [
      { id: new OpId(0, 'peer1'), targetId: 'R', parentId: null } as MoveNode,
      { id: new OpId(1, 'peer1'), targetId: 'A', parentId: 'R' } as MoveNode,
      { id: new OpId(2, 'peer1'), targetId: 'B', parentId: 'R' } as MoveNode,
      // Here our cycle but in a different order
      { id: new OpId(3, 'peer2'), targetId: 'A', parentId: 'B' } as MoveNode,
      { id: new OpId(3, 'peer1'), targetId: 'B', parentId: 'A' } as MoveNode,
    ];

    const tree2 = new ReplicatedTree("peer2", ops2);

    //const randomShuffle = [...ops].sort(() => Math.random() - 0.5);

    const randomShuffle = [
      { id: new OpId(3, 'peer1'), targetId: 'B', parentId: 'A', prevParentId: 'R' } as MoveNode,
      { id: new OpId(1, 'peer1'), targetId: 'A', parentId: 'R', prevParentId: null } as MoveNode,
      { id: new OpId(3, 'peer2'), targetId: 'A', parentId: 'B', prevParentId: 'R' } as MoveNode,
      { id: new OpId(0, 'peer1'), targetId: 'R', parentId: null, prevParentId: null } as MoveNode,
      { id: new OpId(2, 'peer1'), targetId: 'B', parentId: 'R', prevParentId: null } as MoveNode,
    ];

    const tree3 = new ReplicatedTree("peer3", randomShuffle);
  
    printedTree1 = tree1.printTree();
    printedTree2 = tree2.printTree();
    printedTree3 = tree3.printTree();

    console.log('Trees are equal:', tree1.compareStructure(tree3));
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

<div class="flex flex-col gap-4">
  <strong>Peer 3 (random shuffle)</strong>
  {#if printedTree3}
    <pre>{printedTree3}</pre>
  {/if}
</div>
