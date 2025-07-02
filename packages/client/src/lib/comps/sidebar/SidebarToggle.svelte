<script lang="ts">
  import { sidebar } from "$lib/state/layout.svelte";
  import PanelLeftClose from "lucide-svelte/icons/panel-left-close";
  import PanelLeftOpen from "lucide-svelte/icons/panel-left-open";
</script>

<button
  class="p-2 rounded hover:preset-tonal"
  onclick={() => sidebar.toggle()}
  title={sidebar.isOpen ? "Collapse sidebar" : "Expand sidebar"}
  aria-label={sidebar.isOpen ? "Collapse sidebar" : "Expand sidebar"}
>
  {#if sidebar.isOpen}
    <PanelLeftClose size={18} />
  {:else}
    <PanelLeftOpen size={18} />
  {/if}
</button>