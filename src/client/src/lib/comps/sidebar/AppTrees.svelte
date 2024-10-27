<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import { onMount } from "svelte";
  import VertexItem from "./VertexItem.svelte";
  let appTreeIds: string[] = [];
  onMount(() => {
    appTreeIds = [...($currentSpaceStore?.getAppTreeIds() ?? [])];
  });
</script>

<ul>
  {#each appTreeIds as id (id)}
    <li class="relative"><VertexItem {id} /></li>
  {/each}
</ul>
