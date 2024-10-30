<script lang="ts">
  import { page } from "$app/stores";
  import App from "$lib/comps/apps/App.svelte";
  import ChatAppLoader from "$lib/comps/apps/ChatAppLoader.svelte";

  let treeId: string | null = $derived.by(() => {
    return $page.url.searchParams.get("t");
  });
</script>

<App>
  {#if treeId}
    <ChatAppLoader {treeId} />
  {/if}
</App>
