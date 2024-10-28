<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import ChatApp from "./ChatApp.svelte";

  let { treeId }: { treeId: string } = $props();

  let appTree = $derived.by(async () => {
    console.log("Loading app tree", treeId);

    if (!$currentSpaceStore) {
      console.error("No current space id");
      return undefined;
    }

    // Wait for 5 seconds
    //await new Promise((resolve) => setTimeout(resolve, 1000));

    return await $currentSpaceStore.loadAppTree(treeId);
  });
</script>

{#await appTree}
  <div>Loading...</div>
{:then appTree}
  {#if appTree}
    <ChatApp {appTree} />
  {/if}
{:catch}
  <div>Error loading app tree</div>
{/await}
