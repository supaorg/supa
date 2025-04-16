<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import type { VertexChangeEvent } from "@core/replicatedTree/treeTypes";
  import { onMount } from "svelte";
  import AppTreeOptionsPopup from "../popups/AppTreeOptionsPopup.svelte";
  import { page } from "$app/state";
  import { openChatTab } from "$lib/stores/ttabsStore.svelte";

  let { id }: { id: string; } = $props();

  let appTreeId = $state<string | undefined>(undefined);
  let name = $state<string | undefined>(undefined);

  let isOpen = $derived.by(() => {
    const openTreeId = page.url.searchParams.get("t");
    return openTreeId === appTreeId;
  });

  onMount(() => {
    const vertex = $currentSpaceStore?.getVertex(id);
    appTreeId = vertex?.getProperty("tid") as string | undefined;
    name = vertex?.getProperty("_n") as string | undefined;
  });

  $effect(() => {
    const unobserve = $currentSpaceStore?.tree.observe(id, onSpaceChange);
    return () => {
      unobserve?.();
    };
  });

  function onSpaceChange(events: VertexChangeEvent[]) {
    if (events.some((e) => e.type === "property")) {
      const vertex = $currentSpaceStore?.getVertex(id);
      name = vertex?.getProperty("_n") as string | undefined;
    }
  }

  function openChat() {
    if (appTreeId) {
      openChatTab(appTreeId, name ?? "New conversation");
    }
  }
</script>

{#if appTreeId}
  <span
    class={`flex rounded ${isOpen ? "bg-surface-100-900" : "hover:bg-surface-100-900"}`}
  >
    <button 
      class="flex-grow py-2 px-2 truncate text-left" 
      onclick={openChat}
    >
      <span>{name ?? "New conversation"}</span>
    </button>
    {#if isOpen}
      <AppTreeOptionsPopup {appTreeId} />
    {/if}
  </span>
{/if}

