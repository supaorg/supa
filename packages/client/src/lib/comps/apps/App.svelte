<script lang="ts">
  import { onMount } from "svelte";
  import Sidebar from "$lib/comps/sidebar/Sidebar.svelte";
  import type { Snippet } from "svelte";
  import SpaceInspectorWindow from "../space-inspector/SpaceInspectorWindow.svelte";
  import DevPanel from "../dev/DevPanel.svelte";
  import { isDevMode, spaceInspectorOpen } from "$lib/stores/devMode";
  import OllamaAutoConfig from "../models/OllamaAutoConfig.svelte";
  import { createTtabs, TtabsRoot, LocalStorageAdapter } from "ttabs-svelte";

  //let { children }: { children: Snippet } = $props();

  const ttabs = createTtabs();
  
  function resetLayout() {
    ttabs.resetState();
    const root = ttabs.rootGridId as string;
    const row = ttabs.addRow(root, 100);
    const column = ttabs.addColumn(row, 100);
    const panel = ttabs.addPanel(column);
    const tab = ttabs.addTab(panel, "New Tab");
    const tab2 = ttabs.addTab(panel, "New Tab 2");

    ttabs.setFocusedActiveTab(tab);
  }

  onMount(() => {
    resetLayout();
  });
</script>


<OllamaAutoConfig />

{#if $isDevMode && $spaceInspectorOpen}
  <SpaceInspectorWindow />
{/if}

<TtabsRoot {ttabs} />

<!--
<div class="grid h-screen grid-rows-[1fr_auto]">
  <div class="flex overflow-hidden">
    <aside class="relative w-[260px] flex-shrink-0 border-r border-surface-200-800">
      <div class="flex flex-col h-full">
        <Sidebar />
      </div>
    </aside>
    <main class="relative flex-grow h-full overflow-y-auto">
      {@render children()}
    </main>
  </div>

  {#if $isDevMode}
    <div class="w-full border-t border-surface-200-800 bg-surface-100-800-token">
      <DevPanel />
    </div>
  {/if}
</div>
-->