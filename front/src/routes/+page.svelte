<script lang="ts">
  import { onMount } from "svelte";
  import { threadsStore } from "$lib/stores/threads";
  import { goto } from "$app/navigation";

  let threadId: string | null = null;

  onMount(async () => {
    if ($threadsStore.length > 0) {
      threadId = $threadsStore[0].id;

      goto(`/${threadId}`);
    }
  });
</script>

Hey!
