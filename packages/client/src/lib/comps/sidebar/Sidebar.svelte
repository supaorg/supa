<script lang="ts">
  import Settings from "lucide-svelte/icons/settings";
  import AppButtons from "./AppButtons.svelte";
  import LayoutGrid from "lucide-svelte/icons/layout-grid";
  import AppTrees from "./AppTrees.svelte";
  import SpaceSelectorPopup from "../popups/SpaceSelectorPopup.svelte";
  import SidebarPageLink from "./SidebarPageLink.svelte";
  import { txtStore } from "$lib/stores/txtStore";
  import SpagesNavButton from "$lib/spages/SpagesNavButton.svelte";
</script>

<div class="flex flex-col h-full select-none">
  <div class="min-h-min py-2 px-2">
    <AppButtons />

    <SpagesNavButton
      component="apps"
      title="Apps"
      className="w-full flex gap-2 flex-grow py-2 px-2 truncate flex rounded hover:bg-surface-100-900"
    >
      <span class="w-6 h-6 flex-shrink-0">
        <span class="relative flex h-full items-center justify-center">
          <LayoutGrid size={18} />
        </span>
      </span>
      <span class="flex-grow text-left">{$txtStore.basics.apps}</span>
    </SpagesNavButton>
  </div>
  <div class="flex-grow overflow-y-auto px-2">
    <AppTrees />
  </div>
  <div class="min-h-min px-2 py-2">
    <div class="flex items-center gap-2">
      <div class="flex-grow"><SpaceSelectorPopup /></div>
      <div class="flex-shrink-0">
        <SpagesNavButton component="settings" title="Settings" className="flex-grow py-2 px-2 truncate flex rounded hover:bg-surface-100-900">
          <Settings size={18} />
        </SpagesNavButton>
      </div>
    </div>
  </div>
</div>
