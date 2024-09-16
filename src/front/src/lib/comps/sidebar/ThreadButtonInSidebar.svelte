<script lang="ts">
  import type { Thread } from "@shared/models";
  import ThreadOptionsPopup from "../popups/ThreadOptionsPopup.svelte";

  export let thread: Thread;
  export let active = false;

  let classActive = "";

  $: classActive = active ? "bg-primary-active-token" : "";
</script>

<span class={`flex rounded-token hover:bg-surface-100-800-token ${classActive}`}>
  <a href={`/?t=${thread.id}`} class="flex-grow py-2 px-4 truncate">
    <span>{thread.title ? thread.title : "New conversation"}</span>
  </a>
  <ThreadOptionsPopup threadId={thread.id} showOpenButton={active} />
</span>