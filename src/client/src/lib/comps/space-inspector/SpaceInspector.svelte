<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import type AppTree from "@shared/spaces/AppTree";
  import VertexView from "./VertexView.svelte";
  import type { Vertex } from "@shared/replicatedTree/Vertex";

  let spaceRootVertex = $derived($currentSpaceStore?.rootVertex);
  let appTreeRootVertex = $state<Vertex | undefined>(undefined);

  async function openTree(treeId: string) {
    const appTree = await $currentSpaceStore?.loadAppTree(treeId);
    if (appTree) {
      appTreeRootVertex = appTree.tree.rootVertex;
    }
  }

  function resetToSpace() {
    appTreeRootVertex = undefined;
  }
</script>

<ol class="flex items-center gap-4 mb-4 text-sm">
  <li>
    <button 
      class="opacity-60 hover:underline" 
      onclick={resetToSpace}
      disabled={!appTreeRootVertex}
    >
      Space
    </button>
  </li>
  {#if appTreeRootVertex}
    <li class="opacity-50" aria-hidden="true">&rsaquo;</li>
    <li>App Tree</li>
  {/if}
</ol>

{#if spaceRootVertex}
  {#if appTreeRootVertex}
    <VertexView vertex={appTreeRootVertex} onTreeOpen={openTree} />
  {:else}
    <VertexView vertex={spaceRootVertex} onTreeOpen={openTree} />
  {/if}
{/if}
