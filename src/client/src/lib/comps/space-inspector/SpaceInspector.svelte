<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import type AppTree from "@shared/spaces/AppTree";
  import VertexView from "./VertexView.svelte";
  import type { Vertex } from "@shared/replicatedTree/Vertex";

  let spaceRootVertex = $derived($currentSpaceStore?.rootVertex);
  let appTreeRootVertex = $state<Vertex | undefined>(undefined);
  let showingAppTree = $state(false);

  async function onTreeOpen(treeId: string) {
    const appTree = await $currentSpaceStore?.loadAppTree(treeId);
    if (appTree) {
      appTreeRootVertex = appTree.tree.rootVertex;
      showingAppTree = true;
    }
  }

  function showSpace() {
    showingAppTree = false;
  }
</script>

<ol class="flex items-center gap-4 mb-4 text-sm">
  <li>
    <button 
      class="opacity-60 hover:underline" 
      onclick={showSpace}
      disabled={!showingAppTree}
    >
      Space
    </button>
  </li>
  {#if showingAppTree}
    <li class="opacity-50" aria-hidden="true">&rsaquo;</li>
    <li>App Tree</li>
  {/if}
</ol>

{#if spaceRootVertex}
  <div class="space-tree" class:hidden={showingAppTree}>
    <VertexView vertex={spaceRootVertex} {onTreeOpen} />
  </div>

  {#if appTreeRootVertex}
    <div class="app-tree" class:hidden={!showingAppTree}>
      <VertexView vertex={appTreeRootVertex} {onTreeOpen} />
    </div>
  {/if}
{/if}
