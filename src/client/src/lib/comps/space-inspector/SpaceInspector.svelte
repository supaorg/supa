<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import VertexView from "./VertexView.svelte";

  let spaceRootVertex = $derived($currentSpaceStore?.rootVertex);
</script>

{#if spaceRootVertex}
  <VertexView vertex={spaceRootVertex} />
{/if}

