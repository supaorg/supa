<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import type { VertexChangeEvent } from "@shared/replicatedTree/treeTypes";
  import { onMount } from "svelte";
  import AppTreeOptionsPopup from "../popups/AppTreeOptionsPopup.svelte";

  let { id }: { id: string } = $props();

  let classActive = "";
  //$: classActive = active ? "bg-primary-active-token" : "";
  let appTreeId: string | undefined = $state(undefined);
  let name: string | undefined = $state(undefined);

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
    class={`flex rounded-token hover:bg-surface-100-800-token ${classActive}`}
  >
    <a href={`/?t=${appTreeId}`} class="flex-grow py-2 px-4 truncate">
      <span>{name ?? "New conversation"}</span>
    </a>
    <AppTreeOptionsPopup {appTreeId} />
  </span>
{/if}
