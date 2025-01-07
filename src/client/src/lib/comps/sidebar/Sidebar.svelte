<script lang="ts">
  import Settings from "lucide-svelte/icons/settings";
  import AppButtons from "./AppButtons.svelte";
  import LayoutGrid from "lucide-svelte/icons/layout-grid";
  import AppTrees from "./AppTrees.svelte";
    import SpaceSelectorPopup from "../popups/SpaceSelectorPopup.svelte";
</script>

<div class="flex flex-col h-screen">
  <div class="min-h-min px-2 pb-2">
    <AppButtons />
    <a href="/apps" class="w-full flex px-4 py-2 gap-2">
      <span class="w-6 h-6 flex-shrink-0">
        <span class="relative flex h-full items-center justify-center">
          <LayoutGrid size={18} />
        </span>
      </span>
      <span class="flex-grow text-left">Apps</span>
    </a>
  </div>
  <div class="flex-grow overflow-y-auto px-2">
    <AppTrees />
  </div>
  <div class="min-h-min px-2 py-2">
    <div class="flex items-center gap-2 px-4 py-2">
      <div class="flex-grow"><SpaceSelectorPopup /></div>
      <a href="/settings" class="sidebar-btn flex-shrink-0">
        <Settings size={18} />
      </a>
    </div>
  </div>
</div>
