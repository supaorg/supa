<script lang="ts">
  import { ttabs, layoutRefs } from "$lib/ttabs/layout.svelte";
  import { onDestroy, onMount } from "svelte";
  import type { TileColumnState } from "ttabs-svelte";
  import Sidebar from "./Sidebar.svelte";
  import { fly } from 'svelte/transition';

  let sidebarIsOpen = $state(true);
  let sidebarWidth = $state(0);
  let sidebarWidthWhenOpen = $state(300);
  let showHoverSidebar = $state(false);
  let hoverTriggerTimeout: ReturnType<typeof setTimeout> | null = null;
  let closeSidebarTimeout: ReturnType<typeof setTimeout> | null = null;

  function toggleSidebar() {
    sidebarIsOpen = !sidebarIsOpen;

    if (layoutRefs.sidebarColumn) {
      ttabs.updateTile(layoutRefs.sidebarColumn, {
        width: { value: sidebarIsOpen ? sidebarWidthWhenOpen : 0, unit: "px" },
      });
    }
  }

  function handleHoverEnter() {
    if (!sidebarIsOpen) {
      // Clear any closing timeout that might be active
      if (closeSidebarTimeout) {
        clearTimeout(closeSidebarTimeout);
        closeSidebarTimeout = null;
      }

      // Set timeout to show sidebar
      if (!showHoverSidebar) {
        hoverTriggerTimeout = setTimeout(() => {
          showHoverSidebar = true;
        }, 200); // Small delay to prevent accidental triggers
      }
    }
  }

  function handleSidebarEnter() {
    // When entering the sidebar, clear any close timeouts
    if (closeSidebarTimeout) {
      clearTimeout(closeSidebarTimeout);
      closeSidebarTimeout = null;
    }
  }

  function isOverContextMenu(event: MouseEvent) {
    // Check if the related target is inside a popover (context menu)
    const popover = (event.relatedTarget as HTMLElement)?.closest?.('.context-menu');
    return !!popover;
  }

  function handleHoverLeave(event: MouseEvent) {
    // Clear the show timeout if it's active
    if (hoverTriggerTimeout) {
      clearTimeout(hoverTriggerTimeout);
      hoverTriggerTimeout = null;
    }

    // Only start closing if we're not over a context menu
    if (!isOverContextMenu(event)) {
      closeSidebarTimeout = setTimeout(() => {
        showHoverSidebar = false;
      }, 300);
    }
  }

  function handleSidebarLeave(event: MouseEvent) {
    // Only start closing if we're not over a context menu
    if (!isOverContextMenu(event)) {
      closeSidebarTimeout = setTimeout(() => {
        showHoverSidebar = false;
      }, 200);
    }
  }

  $effect(() => {
    if (layoutRefs.sidebarColumn) {
      const sidebar = ttabs.getColumn(layoutRefs.sidebarColumn);
      sidebarWidth = sidebar.width.value;

      // Just in case if the sidebar is at 0 width when we mount,
      // mark it as closed and set the width of the open sidebar to > 0
      if (sidebarWidth <= 50) {
        sidebarIsOpen = false;
        sidebarWidthWhenOpen = 300;
      } else {
        sidebarWidthWhenOpen = sidebarWidth;
      }
    }

    const sub = ttabs.subscribe((tiles) => {
      if (!layoutRefs.sidebarColumn) return;

      const sidebar = tiles[layoutRefs.sidebarColumn] as TileColumnState;
      if (sidebar) {
        sidebarWidth = sidebar.width.value;
        sidebarIsOpen = sidebarWidth > 0;
      }
    });

    return () => {
      sub();
    };
  });

  onDestroy(() => { 
    if (hoverTriggerTimeout) clearTimeout(hoverTriggerTimeout);
    if (closeSidebarTimeout) clearTimeout(closeSidebarTimeout);
  });
</script>

<div class="sidebar-toggle-container">
  <!-- Hover trigger area - only visible when sidebar is closed -->
  {#if !sidebarIsOpen}
    <div
      class="fixed z-10 w-4 h-screen top-0 left-0 opacity-0 cursor-auto"
      onmouseenter={handleHoverEnter}
      onmouseleave={handleHoverLeave}
      tabindex="0"
      role="button"
    ></div>
  {/if}

  <button
    class="sidebar-toggle fixed top-1/2 transform -translate-y-1/2 z-10 p-0 border-none outline-none cursor-pointer hover:opacity-80 transition-opacity"
    style={sidebarIsOpen ? `left: ${sidebarWidth}px;` : "left: 0;"}
    onclick={toggleSidebar}
    aria-label={sidebarIsOpen ? "Close sidebar" : "Open sidebar"}
  >
    {#if sidebarIsOpen}
      <svg
        width="24"
        height="48"
        viewBox="0 0 24 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="transform rotate-180"
      >
        <path
          d="M9 36L15 24L9 12"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-surface-500"
        />
      </svg>
    {:else}
      <svg
        width="24"
        height="48"
        viewBox="0 0 24 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9 36L15 24L9 12"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-surface-500"
        />
      </svg>
    {/if}
  </button>
</div>

<!-- Hoverable sidebar - always rendered but only visible when triggered -->
{#if !sidebarIsOpen}
  <div 
    class="hover-sidebar fixed top-0 h-full w-[300px] bg-surface-50-950 transition-all z-10"
    class:border-r={showHoverSidebar} 
    class:border-surface-300-700={showHoverSidebar}
    class:shadow-2xl={showHoverSidebar}
    style="left: {showHoverSidebar ? '0' : '-300px'};"
    onmouseenter={handleSidebarEnter}
    onmouseleave={handleSidebarLeave}
    tabindex="0"
    role="button"
    in:fly={{ x: -300, duration: 300 }}
    out:fly={{ x: -300, duration: 200 }}
  >
    <Sidebar />
  </div>
{/if}