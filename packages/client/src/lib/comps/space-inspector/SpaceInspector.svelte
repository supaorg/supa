<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import { ttabs } from "$lib/ttabs/ttabsLayout";
  import VertexView from "./VertexView.svelte";
  import type { Vertex } from "reptree";

  let spaceRootVertex = $derived($currentSpaceStore?.rootVertex);
  let appTreeRootVertex = $state<Vertex | undefined>(undefined);
  let showingAppTree = $state(false);

  let currentTreeId = $derived.by(() => {
    const panel = ttabs.getActivePanelTile();
    if (panel?.activeTab) {
      const content = ttabs.getTabContent(panel.activeTab);
      return content?.data?.componentProps?.treeId;
    }
    return undefined;
  });

  async function onTreeOpen(treeId: string) {
    const appTree = await $currentSpaceStore?.loadAppTree(treeId);
    if (appTree) {
      appTreeRootVertex = appTree.tree.root;
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
  {#if currentTreeId && !showingAppTree}
    <li class="opacity-50" aria-hidden="true">&rsaquo;</li>
    <li>
      <button
        class="text-blue-500 hover:underline font-medium"
        onclick={() => onTreeOpen(currentTreeId)}
      >
        Open Current App Tree
      </button>
    </li>
  {/if}
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
