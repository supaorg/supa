<script lang="ts">
  import Sidebar from "$lib/comps/sidebar/Sidebar.svelte";
  import type { Snippet } from "svelte";
  import SpaceInspectorWindow from "../space-inspector/SpaceInspectorWindow.svelte";
  import DevPanel from "../dev/DevPanel.svelte";
  import { isDevMode, spaceInspectorOpen } from "$lib/stores/devMode";

  let { children }: { children: Snippet } = $props();
</script>

{#if $isDevMode && $spaceInspectorOpen}
  <SpaceInspectorWindow />
{/if}

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
