<script lang="ts">
  import Settings from "lucide-svelte/icons/settings-2";
  import AppButtons from "./AppButtons.svelte";
  import LayoutGrid from "lucide-svelte/icons/layout-grid";
  import AppTrees from "./AppTrees.svelte";
  import SpaceSelectorPopup from "../popups/SpaceSelectorPopup.svelte";
  import { txtStore } from "$lib/stores/txtStore";
  import SwinsNavButton from "$lib/swins/SwinsNavButton.svelte";
</script>

<div class="flex flex-col h-full">
  <div class="min-h-min py-2 px-2">
    <AppButtons />

    <SwinsNavButton
      component="apps"
      title="Assistants"
      className="w-full flex gap-2 flex-grow py-2 px-2 truncate flex rounded hover:preset-tonal"
    >
      <span class="w-6 h-6 flex-shrink-0">
        <span class="relative flex h-full items-center justify-center">
          <LayoutGrid size={18} />
        </span>
      </span>
      <span class="flex-grow text-left">{$txtStore.basics.apps}</span>
    </SwinsNavButton>
  </div>
  <div class="flex-grow overflow-y-auto px-2">
    <AppTrees />
  </div>
  <div class="min-h-min px-2 py-2">
    <div class="flex items-center gap-2">
      <div class="flex-grow"><SpaceSelectorPopup /></div>
      <div class="flex-shrink-0">
        <SwinsNavButton component="settings" title="Settings" className="flex-grow py-2 px-2 truncate flex rounded hover:preset-tonal">
          <Settings size={18} />
        </SwinsNavButton>
      </div>
    </div>
  </div>
</div>
