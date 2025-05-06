<script lang="ts">
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import type { VertexChangeEvent } from "reptree/treeTypes";
  import { onMount } from "svelte";
  import AppTreeOptionsPopup from "../popups/AppTreeOptionsPopup.svelte";
  import { openChatTab, ttabs } from "$lib/ttabs/ttabsLayout";

  let { id }: { id: string } = $props();

  let appTreeId = $state<string | undefined>(undefined);
  let name = $state<string | undefined>(undefined);

  // Track if this vertex item has an open tab
  let isOpen = $derived.by(() => {
    // A little hack to force the effect to run when ttabs changes
    const _ = ttabs.tiles;
    if (!appTreeId) return false;

    const tabId = findTabByTreeId(appTreeId);

    return tabId !== undefined;
  });

  let isActive = $derived.by(() => {
    if (!isOpen || !ttabs.focusedActiveTab) return false;

    const tabId = findTabByTreeId(appTreeId!);
    return tabId === ttabs.focusedActiveTab;
  });

  // @TODO: consider having an array of open tabs in ttabs so it's cheaper to check
  // Find a tab with a specific treeId
  function findTabByTreeId(treeId: string): string | undefined {
    // Search through all tab tiles
    for (const tileId in ttabs.tiles) {
      const tile = ttabs.tiles[tileId];
      if (tile.type === "tab") {
        const content = ttabs.getTabContent(tile.id);
        if (
          content?.componentId === "chat" &&
          content?.data?.componentProps?.treeId === treeId
        ) {
          return tile.id;
        }
      }
    }
    return undefined;
  }

  onMount(() => {
    const vertex = spaceStore.currentSpace?.getVertex(id);
    appTreeId = vertex?.getProperty("tid") as string | undefined;
    name = vertex?.getProperty("_n") as string | undefined;
  });

  $effect(() => {
    const unobserve = spaceStore.currentSpace?.tree.observe(id, onSpaceChange);
    return () => {
      unobserve?.();
    };
  });

  function onSpaceChange(events: VertexChangeEvent[]) {
    if (events.some((e) => e.type === "property")) {
      const vertex = spaceStore.currentSpace?.getVertex(id);
      name = vertex?.getProperty("_n") as string | undefined;
      
      // Update any open tab for this conversation with the new name
      if (appTreeId) {
        const tabId = findTabByTreeId(appTreeId);
        if (tabId) {
          ttabs.updateTile(tabId, { name: name ?? "New chat" });
        }
      }
    }
  }

  function openChat() {
    if (appTreeId) {
      openChatTab(appTreeId, name ?? "New chat");
    }
  }
</script>

{#if appTreeId}
  <span
    class={`flex rounded text-sm
      ${isOpen && !isActive ? "preset-tonal-secondary" : ""} 
      ${isActive ? "preset-filled-primary-500" : ""} 
      ${!isOpen ? "hover:preset-tonal" : ""}`}
  >
    <button class="flex-grow py-1 px-2 truncate text-left" onclick={openChat}>
      <span>{name ?? "New chat"}</span>
    </button>
    {#if isActive}
      <AppTreeOptionsPopup {appTreeId} />
    {/if}
  </span>
{/if}
