<script lang="ts">
  import { page } from "$app/stores";
  import { currentWorkspaceThreadsStore } from "$lib/stores/workspaceStore";
  import ThreadButtonInSidebar from "./ThreadButtonInSidebar.svelte";

  let currentThreadId: string | null;

  $: currentThreadId = $page.url.searchParams.get("t");

  // @TODO: get threads from current workspace
</script>

<ul>
  {#each $currentWorkspaceThreadsStore as thread (thread.id)}
    <li class="relative">
      <ThreadButtonInSidebar {thread} active={thread.id === currentThreadId} />
    </li>
  {/each}
</ul>
