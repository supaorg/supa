<script lang="ts">
  import { page } from "$app/stores";
  import { threadsStore } from "$lib/stores/threadStore";
  import ThreadButtonInSidebar from "./ThreadButtonInSidebar.svelte";

  let currentThreadId: string | null;
  page.subscribe((val) => {
    currentThreadId = val.url.searchParams.get("t");
  });
</script>

<ul>
  {#each $threadsStore as thread (thread.id)}
    <li class="relative">
      <ThreadButtonInSidebar {thread} active={thread.id === currentThreadId} />
    </li>
  {/each}
</ul>
