<script lang="ts">
  import ChatApp from "./ChatApp.svelte";
  import { ChatAppData } from "@core/spaces/ChatAppData";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";

  let { treeId }: { treeId: string } = $props();

  let data = $derived.by(async () => {
    if (!spaceStore.currentSpace) {
      throw new Error("No current space id");
    }

    const appTree = await spaceStore.currentSpace.loadAppTree(treeId);
    if (!appTree) {
      throw new Error("Failed to load app tree");
    }

    return new ChatAppData(spaceStore.currentSpace, appTree);
  });
</script>

{#await data}
  <div></div>
{:then data}
  <ChatApp {data} />
{:catch}
  <div>Error loading app tree</div>
{/await}
