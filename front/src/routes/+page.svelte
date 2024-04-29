<script lang="ts">
  import { onMount } from "svelte";
  import { threadsStore } from "$lib/stores/threads";
  import { goto } from "$app/navigation";
  import { page } from '$app/stores';
  import ChatThreadComponent from "$lib/comps/ChatThreadMessages.svelte";

  let threadId: string | null = null;

  page.subscribe((val) => {
    if (val.route.id !== '/') {
      return;
    }

    const threadIdInParams = val.url.searchParams.get('t');
    if(threadIdInParams) {
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
  <ChatThreadComponent {threadId} />
{:else}
  <h1 class="h1">Welcome!</h1>
  <p>Press on that button on the left to start a chat with AI.</p>
{/if}
