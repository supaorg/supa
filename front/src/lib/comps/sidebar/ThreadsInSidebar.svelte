<script lang="ts">
  import { page } from "$app/stores";
  import { threadsStore } from "$lib/stores/threads";
  import ThreadButtonInSidebar from "./ThreadButtonInSidebar.svelte";

  let currentThreadId: string | null;
  page.subscribe((val) => {
    currentThreadId = val.url.searchParams.get("t");
  });
</script>

<ul class="mt-4">
  {#each $threadsStore as thread (thread.id)}
    <li class="relative">
      <ThreadButtonInSidebar {thread} active={thread.id === currentThreadId} />
    </li>
  {/each}
</ul>
