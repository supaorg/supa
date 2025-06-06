<script lang="ts">
  import { sidebar } from "$lib/ttabs/layout.svelte";
  import { onDestroy, onMount } from "svelte";
  import Sidebar from "./Sidebar.svelte";
  import { fly } from "svelte/transition";

  let showHoverSidebar = $state(false);
  let hoverTriggerTimeout: ReturnType<typeof setTimeout> | null = null;
  let closeSidebarTimeout: ReturnType<typeof setTimeout> | null = null;

  function handleHoverEnter() {
    if (!sidebar.isOpen) {
      // Clear any closing timeout that might be active
      if (closeSidebarTimeout) {
        clearTimeout(closeSidebarTimeout);
        closeSidebarTimeout = null;
      }

      // Set timeout to show sidebar
      if (!showHoverSidebar) {
        hoverTriggerTimeout = setTimeout(() => {
          showHoverSidebar = true;
        }, 200);
      }
    }
  }

  function isOverContextMenu(event: MouseEvent) {
    // Check if the related target is inside a popover (context menu)
    const popover = (event.relatedTarget as HTMLElement)?.closest?.(
      ".context-menu"
    );
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

  onDestroy(() => {
    if (hoverTriggerTimeout) clearTimeout(hoverTriggerTimeout);
    if (closeSidebarTimeout) clearTimeout(closeSidebarTimeout);
  });
</script>

<!-- Hover trigger area - only visible when sidebar is closed -->
{#if !sidebar.isOpen}
  <div
    class="fixed z-10 w-10 h-[calc(100vh-2.5rem)] top-[2.5rem] left-0 opacity-0 cursor-auto"
    onmouseenter={handleHoverEnter}
    onmouseleave={handleHoverLeave}
    tabindex="0"
    role="button"
  ></div>
{/if}

<!-- Hoverable sidebar - always rendered but only visible when triggered -->
{#if !sidebar.isOpen}
  <div
    class="hover-sidebar fixed top-0 h-full w-[300px] bg-surface-50-950 transition-all z-10"
    class:border-r={showHoverSidebar}
    class:border-surface-300-700={showHoverSidebar}
    class:shadow-2xl={showHoverSidebar}
    style="left: {showHoverSidebar ? '0' : '-300px'};"
    onmouseenter={handleHoverEnter}
    onmouseleave={handleSidebarLeave}
    tabindex="0"
    role="button"
    in:fly={{ x: -300, duration: 300 }}
    out:fly={{ x: -300, duration: 200 }}
  >
    <Sidebar />
  </div>
{/if}
