<script lang="ts">
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import VertexItem from "./VertexItem.svelte";
  import type { VertexChangeEvent } from "reptree/treeTypes";
  import type Space from "@core/spaces/Space";
  import { onMount } from "svelte";

  let appTreeIds: string[] = $state([]);
  let currentSpace: Space | null = $state(null);
  let appTreesUnobserve: (() => void) | undefined;

  $effect(() => {
    console.log("currentSpace (from $effect)", spaceStore.currentSpace);

    if (currentSpace === spaceStore.currentSpace) {
      return;
    }

    appTreesUnobserve?.();

    currentSpace = spaceStore.currentSpace;

    console.log("currentSpace (from setCurrentSpace)", currentSpace);

    if (currentSpace) {
      appTreeIds = [...(currentSpace.getAppTreeIds() ?? [])];
      appTreesUnobserve = currentSpace.tree.observe(
        currentSpace.appTreesVertex.id,
        onAppTreeChange
      );
    } else {
      appTreeIds = [];
    }

    return () => {
      appTreesUnobserve?.();
    };
  });

  function setCurrentSpace() {}

  function onAppTreeChange(events: VertexChangeEvent[]) {
    if (events.some((e) => e.type === "children")) {
      appTreeIds = [...(currentSpace?.getAppTreeIds() ?? [])];
    }
  }
</script>

<ul class="space-y-1">
  {#each [...appTreeIds].reverse() as id (id)}
    <li class="relative"><VertexItem {id} /></li>
  {/each}
</ul>
