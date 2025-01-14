<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import { onMount } from "svelte";
  import VertexItem from "./VertexItem.svelte";
  import type { VertexChangeEvent } from "@shared/replicatedTree/treeTypes";
  import type Space from "@shared/spaces/Space";

  let appTreeIds = $state<string[]>([]);
  let currentSpace = $state<Space | null>(null);
  let appTreesUnobserve: (() => void) | undefined;

  onMount(() => {
    const currentSpaceSub = currentSpaceStore.subscribe((space) => {
      if (currentSpace === space) {
        return;
      }

      appTreesUnobserve?.();

      currentSpace = space;

      if (currentSpace) {
        appTreeIds = [...(currentSpace.getAppTreeIds() ?? [])];
        appTreesUnobserve = currentSpace.tree.observe(
          currentSpace.appTreesVertex.id,
          onAppTreeChange,
        );
      } else {
        appTreeIds = [];
      }
    });

    return () => {
      currentSpaceSub?.();
      appTreesUnobserve?.();
    };
  });

  function onAppTreeChange(events: VertexChangeEvent[]) {
    if (events.some((e) => e.type === "children")) {
      appTreeIds = [...(currentSpace?.getAppTreeIds() ?? [])];
    }
  }
</script>

<ul>
  {#each [...appTreeIds].reverse() as id (id)}
    <li class="relative"><VertexItem {id} /></li>
  {/each}
</ul>
