<script lang="ts">
  import ChatThreadComponent from "$lib/comps/ChatThreadMessages.svelte";

  export let data;
  let threadId = data.threadId;
  
  $: {
    threadId = data.threadId;
  }
</script>

<ChatThreadComponent {threadId} />