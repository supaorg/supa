<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import { onMount } from "svelte";

  let { id }: { id: string } = $props();

  let classActive = "";
  //$: classActive = active ? "bg-primary-active-token" : "";
  let appTreeId: string | undefined = $state(undefined);

  onMount(() => {
    const vertex = $currentSpaceStore?.getVertex(id);

    console.log("vertex", vertex);

    appTreeId = vertex?.getProperty("tree-id")?.value as string | undefined;

    console.log("appTreeId", appTreeId);
  });
</script>

<span
  class={`flex rounded-token hover:bg-surface-100-800-token ${classActive}`}
>
  <a href={`/?t=${appTreeId}`} class="flex-grow py-2 px-4 truncate">
    <span>{"New conversation"}</span>
  </a>
  <!--<ThreadOptionsPopup threadId={thread.id} showOpenButton={active} />-->
</span>
