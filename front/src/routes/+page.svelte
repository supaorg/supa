<script lang="ts">
  import { threadsStore } from "$lib/stores/threadStore";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import ThreadMessages from "$lib/comps/ThreadMessages.svelte";
  import CenteredPage from "$lib/comps/CenteredPage.svelte";

  let threadId: string | null = null;

  page.subscribe((val) => {
    if (val.route.id !== "/") {
      return;
    }

    const threadIdInParams = val.url.searchParams.get("t");
    if (threadIdInParams) {
      threadId = threadIdInParams;
    } else {
      if ($threadsStore.length > 0) {
        threadId = $threadsStore[0].id;
        goto(`/?t=${threadId}`);
      }
    }
  });
</script>

{#if threadId}
  <ThreadMessages {threadId} />
{:else}
  <CenteredPage>
    <h1 class="h1 mb-4">Welcome to Supamind</h1>
    <p>
      Press on "Ask AI" in the left column to chat with the default assistant or <a
        href="/apps"
        class="anchor">create your own</a
      >.
    </p>
  </CenteredPage>
{/if}
