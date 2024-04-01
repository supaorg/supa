<script lang="ts">
  import { page } from "$app/stores";
  import { threadsStore } from "$lib/stores/threads";
  import ThreadButtonInSidebar from "./ThreadButtonInSidebar.svelte";

  let currentThreadId: string | null;
  page.subscribe((val) => {
    currentThreadId = val.params.threadId ? val.params.threadId : null;
  });
</script>

<ul>
  {#each $threadsStore as thread (thread.id)}
    <li class="relative mb-1">
      <ThreadButtonInSidebar
        {thread}
        active={thread.id === currentThreadId}
      />
    </li>
  {/each}
</ul>
