<script lang="ts">
  import { sidebar } from "$lib/ttabs/layout.svelte";
  import { onDestroy, onMount, untrack } from "svelte";
  import Sidebar from "./Sidebar.svelte";

  let showHoverSidebar = $state(false);
  let hoverTriggerTimeout: ReturnType<typeof setTimeout> | null = null;
  let closeSidebarTimeout: ReturnType<typeof setTimeout> | null = null;
  let recentlyClosed = $state(false);

  function handleHoverEnter() {
    if (!sidebar.isOpen && !recentlyClosed) {
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
      ".context-menu",
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

  // Watch for sidebar state changes
  $effect(() => {
    if (!sidebar.isOpen) {
      untrack(() => {
        // Force the hover sidebar in a closed state just in case
        showHoverSidebar = false;
        // Set recently closed flag
        recentlyClosed = true;
        // Clear the flag after a delay
        setTimeout(() => {
          recentlyClosed = false;
        }, 500); // Half-second delay
      });
    }
  });

  onDestroy(() => {
    if (hoverTriggerTimeout) clearTimeout(hoverTriggerTimeout);
    if (closeSidebarTimeout) clearTimeout(closeSidebarTimeout);
  });
</script>

<!-- Hover trigger area - only present when sidebar is closed and not recently (500ms or so) closed -->
{#if !sidebar.isOpen && !recentlyClosed}
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
    class="hover-sidebar fixed top-0 h-full w-[300px] bg-surface-50-950 z-10"
    class:show-sidebar={showHoverSidebar}
    class:border-r={showHoverSidebar}
    class:border-surface-300-700={showHoverSidebar}
    class:shadow-2xl={showHoverSidebar}
    onmouseenter={handleHoverEnter}
    onmouseleave={handleSidebarLeave}
    tabindex="0"
    role="button"
  >
    <Sidebar />
  </div>
{/if}

<style>
  .hover-sidebar {
    transform: translateX(-300px);
    transition: transform 200ms ease-out, border-color 200ms, box-shadow 200ms;
  }
  
  .hover-sidebar.show-sidebar {
    transform: translateX(0);
  }
</style>
