<script lang="ts">
  import { spaceStore } from "$lib/state/spaceStore.svelte";
  import VertexItem from "./VertexItem.svelte";
  import type { VertexChangeEvent } from "reptree/treeTypes";

  let appTreeIds: string[] = $state([]);
  let appTreesUnobserve: (() => void) | undefined;

  $effect(() => {
    if (spaceStore.currentSpace) {
      appTreeIds = [...(spaceStore.currentSpace.getAppTreeIds() ?? [])];
      appTreesUnobserve = spaceStore.currentSpace.tree.observe(
        spaceStore.currentSpace.appTreesVertex.id,
        onAppTreeChange
      );
    } else {
      appTreeIds = [];
    }

    return () => {
      appTreesUnobserve?.();
    };
  });

  function onAppTreeChange(events: VertexChangeEvent[]) {
    if (events.some((e) => e.type === "children")) {
      appTreeIds = [...(spaceStore.currentSpace?.getAppTreeIds() ?? [])];
    }
  }
</script>

<ul class="space-y-1">
  {#each [...appTreeIds].reverse() as id (id)}
    <li class="relative"><VertexItem {id} /></li>
  {/each}
</ul>
