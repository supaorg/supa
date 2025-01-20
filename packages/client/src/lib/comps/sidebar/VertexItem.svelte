<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import type { VertexChangeEvent } from "@core/replicatedTree/treeTypes";
  import { onMount } from "svelte";
  import AppTreeOptionsPopup from "../popups/AppTreeOptionsPopup.svelte";
  import { page } from "$app/state";

  let { id }: { id: string; } = $props();

  let appTreeId: string | undefined = $state(undefined);
  let name: string | undefined = $state(undefined);

  let isOpen = $derived.by(() => {
    const openTreeId = page.url.searchParams.get("t");
    return openTreeId === appTreeId;
  });

  let classActive = $derived(isOpen ? "bg-primary-500" : "");

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
</script>

{#if appTreeId}
  <span
    class={`flex rounded-token ${isOpen ? "bg-surface-100-900" : "hover:bg-surface-100-900"}`}
  >
    <a href={`/?t=${appTreeId}`} class="flex-grow py-2 px-2 truncate">
      <span>{name ?? "New conversation"}</span>
    </a>
    {#if isOpen}
      <AppTreeOptionsPopup {appTreeId} />
    {/if}
  </span>
{/if}

