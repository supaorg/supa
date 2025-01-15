<script lang="ts">
  import type { Vertex } from "@shared/replicatedTree/Vertex";
  import { onMount, onDestroy } from "svelte";
  import Self from "./VertexView.svelte";
  
  let { vertex }: { vertex: Vertex } = $props();
  let children = $state<Vertex[]>([]);
  let properties = $state<Record<string, any>>({});
  let isExpanded = $state(false);

  function formatPropertyKey(key: string): string {
    if (key === '_c') return 'created at';
    if (key === 'tid') return 'app tree';
    return key;
  }

  function formatPropertyValue(key: string, value: any): string {
    if (key === '_c') {
      try {
        const date = new Date(value);
        return date.toLocaleString();
      } catch {
        return value;
      }
    }
    return value;
  }

  function openAppTree(treeId: string) {
    // TODO: Implement opening app tree
    console.log('Opening app tree:', treeId);
  }

  function updateVertex() {
    children = vertex.children;
    const allProps = vertex.getProperties();
    // Filter out the _n property
    const { _n, ...filteredProps } = allProps;
    properties = filteredProps;
  }

  function toggleExpand() {
    isExpanded = !isExpanded;
  }

  onMount(() => {
    updateVertex();
    const unobserve = vertex.observe((events) => {
      if (events.some((e) => e.type === "property" || e.type === "children")) {
        updateVertex();
      }
    });
    return () => unobserve();
  });
</script>

<div class="vertex-item py-2" class:ml-4={vertex.parentId !== null}>
  <div class="vertex-header">
    <span class="vertex-name font-medium">
      {vertex.name ?? vertex.id}
    </span>
  </div>

  <div class="vertex-content">
    <div class="properties-section text-xs">
      {#each Object.entries(properties) as [key, value]}
        <div class="property-item flex items-center gap-2 p-2 hover:bg-surface-500/10">
          <span class="property-key opacity-75">{formatPropertyKey(key)}:</span>
          {#if key === 'tid'}
            <button 
              class="px-2 py-0.5 rounded hover:variant-soft"
              on:click={() => openAppTree(value)}
            >
              [open]
            </button>
          {:else}
            <span class="property-value font-mono">{formatPropertyValue(key, value)}</span>
          {/if}
        </div>
      {/each}

      {#if children.length > 0}
        <div class="property-item flex items-center gap-2 p-2 hover:bg-surface-500/10">
          <button
            class="vertex-summary-symbol fill-current w-5 h-5 text-center transition-transform duration-[200ms] hover:variant-soft rounded-container-token p-1 -ml-1 flex items-center justify-center"
            class:rotate-180={isExpanded}
            on:click={toggleExpand}
            aria-expanded={isExpanded}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-3 h-3">
              <path
                d="M201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"
              ></path>
            </svg>
          </button>
          <span class="property-key opacity-75">children:</span>
          <span class="property-value font-mono">[{children.length}]</span>
        </div>

        {#if isExpanded}
          <div class="vertex-item-children mt-2 pl-[11px] relative" role="group">
            <div class="absolute left-[9px] top-0 bottom-0 border-l border-surface-500/20"></div>
            {#each children as child (child.id)}
              <Self vertex={child} />
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .vertex-summary-symbol {
    cursor: pointer;
  }
</style>


