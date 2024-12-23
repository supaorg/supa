<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import { onMount, onDestroy } from "svelte";
  import VertexItem from "./VertexItem.svelte";
  import type { VertexChangeEvent } from "@shared/replicatedTree/treeTypes";
  
  let appTreeIds: string[] = $state([]);

  onMount(() => {
    appTreeIds = [...($currentSpaceStore?.getAppTreeIds() ?? [])];

    $currentSpaceStore?.tree.subscribe(
      $currentSpaceStore?.appTreesVertex.id,
      onAppTreeChange,
    );
  });

  onDestroy(() => {
    $currentSpaceStore?.tree.unsubscribe(
      $currentSpaceStore?.appTreesVertex.id,
      onAppTreeChange,
    );
  });

  function onAppTreeChange(event: VertexChangeEvent) {
    if (event.type === "children") {
      appTreeIds = [...($currentSpaceStore?.getAppTreeIds() ?? [])];
    }
  }
</script>

<ul>
  {#each appTreeIds as id (id)}
    <li class="relative"><VertexItem {id} /></li>
  {/each}
</ul>
