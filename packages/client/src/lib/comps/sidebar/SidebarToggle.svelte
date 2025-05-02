<script lang="ts">
  import { ttabs, sidebarColumn } from "$lib/ttabs/ttabsLayout";
  import { ChevronLeft, ChevronRight } from "lucide-svelte";
  import { onMount } from "svelte";
  import type { TileColumn } from "ttabs-svelte";

  let sidebarIsOpen = $state(true);
  let sidebarWidth = $state(0);
  let sidebarWidthWhenOpen = $state(0);

  function toggleSidebar() {
    sidebarIsOpen = !sidebarIsOpen;

    if (sidebarColumn) {
      ttabs.updateTile(sidebarColumn, {
        width: { value: sidebarIsOpen ? sidebarWidthWhenOpen : 0, unit: "px" },
      });
    }
  }

  onMount(() => {
    if (sidebarColumn) {
      const sidebar = ttabs.getColumn(sidebarColumn);
      sidebarWidth = sidebar.width.value;
      sidebarWidthWhenOpen = sidebar.width.value;
    }

    const sub = ttabs.subscribe((tiles) => {
      if (!sidebarColumn) return;

      const sidebar = tiles[sidebarColumn] as TileColumn;
      if (sidebar) {
        sidebarWidth = sidebar.width.value;
      }
    });

    return () => {
      sub();
    };
  });
</script>

<button
  class="fixed top-1/2 transform -translate-y-1/2 z-10 bg-surface-200-800 text-surface-900-50 p-1 rounded-r-md shadow-md hover:bg-primary-500 transition-colors"
  style={sidebarIsOpen ? `left: ${sidebarWidth}px;` : "left: 0;"}
  onclick={toggleSidebar}
  aria-label={sidebarIsOpen ? "Close sidebar" : "Open sidebar"}
>
  {#if sidebarIsOpen}
    <ChevronLeft size={20} />
  {:else}
    <ChevronRight size={20} />
  {/if}
</button>
