<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import ChatApp from "./ChatApp.svelte";
  import { ChatAppData } from "@shared/spaces/ChatAppData";

  let { treeId }: { treeId: string } = $props();

  let data = $derived.by(async () => {
    if (!$currentSpaceStore) {
      throw new Error("No current space id");
    }

    const appTree = await $currentSpaceStore.loadAppTree(treeId);
    if (!appTree) {
      throw new Error("Failed to load app tree");
    }

    return new ChatAppData($currentSpaceStore, appTree.tree);
  });
</script>

{#await data}
  <div></div>
{:then data}
  <ChatApp {data} />
{:catch}
  <div>Error loading app tree</div>
{/await}

