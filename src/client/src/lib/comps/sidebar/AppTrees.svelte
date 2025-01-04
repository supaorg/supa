<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import { onMount, onDestroy } from "svelte";
  import VertexItem from "./VertexItem.svelte";
  import type { VertexChangeEvent } from "@shared/replicatedTree/treeTypes";
  import { page } from "$app/state";

  let appTreeIds: string[] = $state([]);

  let openAppTreeId = $derived.by(() => {
    const url = page.url;

    const t = url.searchParams.get("t");

    console.log("openAppTreeId", t);

    return t;
  });

  onMount(() => {
    appTreeIds = [...($currentSpaceStore?.getAppTreeIds() ?? [])];

    const unsubscribe = $currentSpaceStore?.tree.observe(
      $currentSpaceStore?.appTreesVertex.id,
      onAppTreeChange,
    );

    return () => unsubscribe?.();
  });

  function onAppTreeChange(events: VertexChangeEvent[]) {
    if (events.some((e) => e.type === "children")) {
      appTreeIds = [...($currentSpaceStore?.getAppTreeIds() ?? [])];
    }
  }
</script>

<ul>
  {#each appTreeIds as id (id)}
    <li class="relative"><VertexItem {id} /></li>
  {/each}
</ul>
