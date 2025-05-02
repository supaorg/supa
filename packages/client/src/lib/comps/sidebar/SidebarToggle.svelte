<script lang="ts">
  import { ttabs, sidebarColumn } from "$lib/ttabs/ttabsLayout";
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

      // Just in case if the sidebar is at 0 width when we mount,
      // mark it as closed and set the width of the open sidebar to > 0
      if (sidebarWidthWhenOpen === 0) {
        sidebarIsOpen = false;
        sidebarWidthWhenOpen = 300;
      }
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
  class="fixed top-1/2 transform -translate-y-1/2 z-10 p-0 bg-transparent border-none outline-none cursor-pointer hover:opacity-80 transition-opacity"
  style={sidebarIsOpen ? `left: ${sidebarWidth}px;` : "left: 0;"}
  onclick={toggleSidebar}
  aria-label={sidebarIsOpen ? "Close sidebar" : "Open sidebar"}
>
  {#if sidebarIsOpen}
    <svg width="24" height="48" viewBox="0 0 24 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="transform rotate-180">
      <path d="M9 36L15 24L9 12" stroke="var(--color-surface-500)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  {:else}
    <svg width="24" height="48" viewBox="0 0 24 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 36L15 24L9 12" stroke="var(--color-surface-500)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  {/if}
</button>
