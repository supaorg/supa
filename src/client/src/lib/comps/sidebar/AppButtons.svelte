<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import Pen from "lucide-svelte/icons/pen";

  function newAppTree() {
    if (!$currentSpaceStore) return;

    $currentSpaceStore.newAppTree('default-chat');
  }
</script>

<button
class="sidebar-btn w-full flex"
on:click={newAppTree}
>
<span class="w-6 h-6 flex-shrink-0">
  <span
    class="relative flex h-full items-center justify-center"
  >
    <Pen size={18} />
  </span>
</span>
<span class="flex-grow text-left">Ask AI</span>
</button>