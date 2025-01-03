<script lang="ts">
  import { page } from "$app/stores";
  import ChatAppLoader from "$lib/comps/apps/ChatAppLoader.svelte";

  let treeId: string | null = $derived.by(() => {
    return $page.url.searchParams.get("t");
  });
</script>

{#if treeId}
  <ChatAppLoader {treeId} />
{/if}