<script lang="ts">
  import { onMount } from "svelte";
  import { threadsStore } from "$lib/stores/threads";
  import { goto } from "$app/navigation";
  import { page } from '$app/stores';
  import ChatThreadComponent from "$lib/comps/ChatThreadMessages.svelte";

  let threadId: string | null = null;

  page.subscribe((val) => {
    const threadIdInParams = val.url.searchParams.get('t');
    if(threadIdInParams) {
      threadId = threadIdInParams;
    } else {
      if ($threadsStore.length > 0) {
        threadId = $threadsStore[0].id;
        goto(`?t=${threadId}`);
      }
    }
  });
</script>

{#if threadId}
  <ChatThreadComponent {threadId} />
{:else}
  <p>@TODO: make a page for new users</p>
{/if}
