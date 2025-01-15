<script lang="ts">
  import type { Vertex } from "@shared/replicatedTree/Vertex";
  import { onMount, onDestroy } from "svelte";
  let { vertex }: { vertex: Vertex } = $props();
  import Self from "./VertexView.svelte";
  

  let children = $state<Vertex[]>([]);
  let properties = $state<Record<string, any>>({});
  let isExpanded = $state(false);

  function updateVertex() {
    children = vertex.children;
    properties = vertex.getProperties();
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

<div class="vertex-item" class:ml-4={vertex.parentId !== null}>
  <button
    class="vertex-item-summary w-full text-left list-none flex items-center cursor-pointer space-x-4 rounded-container-token py-4 px-4 hover:variant-soft"
    onclick={toggleExpand}
    aria-expanded={isExpanded}
    type="button"
  >
    <div
      class="vertex-summary-symbol fill-current w-3 text-center transition-transform duration-[200ms]"
      class:rotate-180={isExpanded}
    >
      {#if children.length > 0}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
          <path
            d="M201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"
          ></path>
        </svg>
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
          class="w-3 opacity-10"
        >
          <path
            d="M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"
          ></path>
        </svg>
      {/if}
    </div>
    <div class="vertex-item-content">
      <span>
        {vertex.name ?? vertex.id}
      </span>
      <ul class="text-xs">
        {#each Object.entries(properties) as [key, value]}
          <li>{key}: {value}</li>
        {/each}
      </ul>
    </div>
  </button>

  {#if isExpanded && children.length > 0}
    <div class="vertex-item-children ml-4" role="group">
      {#each children as child (child.id)}
        <Self vertex={child} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .vertex-item {
    border-left: 1px solid rgba(128, 128, 128, 0.2);
  }
</style>


