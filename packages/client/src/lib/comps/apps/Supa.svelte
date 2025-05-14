<script lang="ts">
  import SpaceInspectorWindow from "../space-inspector/SpaceInspectorWindow.svelte";
  import DevPanel from "../dev/DevPanel.svelte";
  import { isDevMode, spaceInspectorOpen } from "$lib/stores/devMode";
  import OllamaAutoConfig from "../models/OllamaAutoConfig.svelte";
  import SwinsContainer from "$lib/swins/SwinsContainer.svelte";
  import { swins } from "$lib/swins/swinsLayout";
  import ContextMenuHandler from "../ContextMenuHandler.svelte";
  import SidebarToggle from "../sidebar/SidebarToggle.svelte";
  import SupaTtabsLayout from "../SupaTtabsLayout.svelte";
</script>

<OllamaAutoConfig />

{#if $isDevMode && $spaceInspectorOpen}
  <SpaceInspectorWindow />
{/if}

<div class="grid h-screen grid-rows-[1fr_auto] border-t border-surface-200-800">
  <div class="flex overflow-hidden">
    <main class="relative flex-grow h-full overflow-y-auto">
      <SupaTtabsLayout />
    </main>
  </div>

  {#if $isDevMode}
    <div
      class="w-full border-t border-surface-200-800 bg-surface-100-800-token"
    >
      <DevPanel />
    </div>
  {/if}
</div>

<SidebarToggle />

<SwinsContainer swins={swins} />

<ContextMenuHandler />
