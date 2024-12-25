<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import type { VertexChangeEvent } from "@shared/replicatedTree/treeTypes";
  import { onMount } from "svelte";

  let { id }: { id: string } = $props();

  let classActive = "";
  //$: classActive = active ? "bg-primary-active-token" : "";
  let appTreeId: string | undefined = $state(undefined);
  let name: string | undefined = $state(undefined);

  onMount(() => {
    const vertex = $currentSpaceStore?.getVertex(id);
    appTreeId = vertex?.getProperty("tid")?.value as string | undefined;
    name = vertex?.getProperty("_n")?.value as string | undefined;
  });

  $effect(() => {
    const unobserve = $currentSpaceStore?.tree.observe(id, onSpaceChange);
    return () => {
      unobserve?.();
    };
  });

  function onSpaceChange(event: VertexChangeEvent) {
    if (event.type === "property") {
      const vertex = $currentSpaceStore?.getVertex(id);
      name = vertex?.getProperty("_n")?.value as string | undefined;
    }
  }
</script>

<span
  class={`flex rounded-token hover:bg-surface-100-800-token ${classActive}`}
>
  <a href={`/?t=${appTreeId}`} class="flex-grow py-2 px-4 truncate">
    <span>{name ?? "New conversation"}</span>
  </a>
  <!--<ThreadOptionsPopup threadId={thread.id} showOpenButton={active} />-->
</span>
