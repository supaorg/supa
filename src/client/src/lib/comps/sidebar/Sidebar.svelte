<script lang="ts">
  import Settings from "lucide-svelte/icons/settings";
  import AppButtons from "./AppButtons.svelte";
  import LayoutGrid from "lucide-svelte/icons/layout-grid";
  import AppTrees from "./AppTrees.svelte";
  import SpaceSelectorPopup from "../popups/SpaceSelectorPopup.svelte";
  import SidebarPageLink from "./SidebarPageLink.svelte";
</script>

<div class="min-h-min py-2 px-2">
  <AppButtons />
  <SidebarPageLink href="/apps">
    <span class="w-full flex gap-2">
      <span class="w-6 h-6 flex-shrink-0">
        <span class="relative flex h-full items-center justify-center">
          <LayoutGrid size={18} />
        </span>
      </span>
      <span class="flex-grow text-left">Apps</span>
    </span>
  </SidebarPageLink>
</div>
<div class="flex-grow overflow-y-auto px-2">
  <AppTrees />
</div>
<div class="min-h-min px-2 py-2">
  <div class="flex items-center gap-2">
    <div class="flex-grow"><SpaceSelectorPopup /></div>
    <div class="flex-shrink-0">
      <SidebarPageLink href="/settings">
        <Settings size={18} />
      </SidebarPageLink>
    </div>
  </div>
</div>
