<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import ThreadMessages from "$lib/comps/ThreadMessages.svelte";
  import CenteredPage from "$lib/comps/CenteredPage.svelte";
  import { threadsStore } from "$lib/stores/workspaceStore";

  let threadId: string | null = null;

  $: {
    threadId = $page.url.searchParams.get("t");
    if (
      $page.route.id === "/" &&
      !threadId &&
      $threadsStore.length > 0
    ) {
      threadId = $threadsStore[0]?.id;
      if (threadId) goto(`/?t=${threadId}`);
    }
  }

  // @TODO: get threads from current workspace
</script>

{#if threadId}
  <ThreadMessages {threadId} />
{:else}
  <CenteredPage>
    <h1 class="h1 mb-4">Welcome to Supamind</h1>
    <p>
      Press on "Ask AI" in the left column to chat with the default assistant or <a
        href="/apps/new-config"
        class="anchor">create your own</a
      >.
    </p>
  </CenteredPage>
{/if}
