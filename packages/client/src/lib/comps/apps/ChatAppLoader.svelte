<script lang="ts">
  import ChatApp from "./ChatApp.svelte";
  import { ChatAppData } from "@supa/core";
  import { clientState } from "@supa/client/state/clientState.svelte";

  let { treeId }: { treeId: string } = $props();

  let data = $derived.by(async () => {
    if (!clientState.currentSpace) {
      throw new Error("No current space id");
    }

    const appTree = await clientState.currentSpace.loadAppTree(treeId);
    if (!appTree) {
      throw new Error("Failed to load app tree");
    }

    return new ChatAppData(clientState.currentSpace, appTree);
  });
</script>

{#await data}
  <div></div>
{:then data}
  <ChatApp {data} />
{:catch}
  <div>Error loading app tree</div>
{/await}
