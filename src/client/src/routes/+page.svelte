<script lang="ts">
  import App from "$lib/comps/apps/App.svelte";
  import { page } from "$app/stores";

  let treeId: string | null = null;

  $: {
    treeId = $page.url.searchParams.get("t");
    /*
    if ($page.route.id === "/" && !threadId && $threadsStore.length > 0) {
      threadId = $threadsStore[0]?.id;
      if (threadId) goto(`/?t=${threadId}`);
    }
    */

    console.log('treeId', treeId);
  }
</script>

<App {treeId} />
