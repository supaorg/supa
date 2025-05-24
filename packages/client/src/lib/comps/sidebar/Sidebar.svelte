<script lang="ts">
  import Settings from "lucide-svelte/icons/settings-2";
  import PanelLeftClose from "lucide-svelte/icons/panel-left-close";
  import AppButtons from "./AppButtons.svelte";
  import AppTrees from "./AppTrees.svelte";
  import SpaceSelectorPopup from "../popups/SpaceSelectorPopup.svelte";
  import SwinsNavButton from "$lib/swins/SwinsNavButton.svelte";
  import { sidebar } from "$lib/ttabs/layout.svelte";
</script>

<div class="supa-sidebar flex flex-col h-full">
  <div class="min-h-min py-2 px-2">
    <div class="flex items-center w-full gap-2 pb-3">
      <div class="flex-1 min-w-0">
        <SpaceSelectorPopup />
      </div>
      <div class="flex items-center">
        <SwinsNavButton component="settings" title="Settings" className="p-2 rounded hover:preset-tonal">
          <Settings size={18} />
        </SwinsNavButton>
        <button 
          class="p-2 rounded hover:preset-tonal" 
          title="Close sidebar" 
          aria-label="Close sidebar"
          on:click={() => {
            sidebar.close();
          }}
        >
          <PanelLeftClose size={18} />
        </button>
      </div>
    </div>
    <AppButtons />
  </div>
  <div class="flex-grow overflow-y-auto">
    <div class="px-2">
      <AppTrees />
    </div>
  </div>
</div>

<style>
  :global {
    .supa-sidebar {
      background-color: var(--color-surface-100-900);
    }
  }
</style>
