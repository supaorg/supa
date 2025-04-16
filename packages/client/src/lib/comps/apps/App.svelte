<script lang="ts">
  import SpaceInspectorWindow from "../space-inspector/SpaceInspectorWindow.svelte";
  import DevPanel from "../dev/DevPanel.svelte";
  import { isDevMode, spaceInspectorOpen } from "$lib/stores/devMode";
  import OllamaAutoConfig from "../models/OllamaAutoConfig.svelte";
  import { TtabsRoot } from "ttabs-svelte";
  import { ttabs } from "$lib/stores/ttabsStore.svelte";
</script>

<OllamaAutoConfig />

{#if $isDevMode && $spaceInspectorOpen}
  <SpaceInspectorWindow />
{/if}

<div class="grid h-screen grid-rows-[1fr_auto]">
  <div class="flex overflow-hidden">
    <main class="relative flex-grow h-full overflow-y-auto">
      <TtabsRoot {ttabs} />
    </main>
  </div>

  {#if $isDevMode}
    <div class="w-full border-t border-surface-200-800 bg-surface-100-800-token">
      <DevPanel />
    </div>
  {/if}
</div>