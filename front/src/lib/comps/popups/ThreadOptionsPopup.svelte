<script lang="ts">
  import { EllipsisVertical, Icon } from "svelte-hero-icons";
  import type { PopupSettings } from "@skeletonlabs/skeleton";
  import { popup } from "@skeletonlabs/skeleton";
  import Portal from "svelte-portal";
  import { client } from "$lib/tools/client";
  import { goto } from "$app/navigation";
  import { apiRoutes } from "@shared/apiRoutes";
    import { threadsStore } from "$lib/stores/threadStore";

  export let threadId: string;
  export let showOpenButton = true;

  const popupSettings: PopupSettings = {
    event: "click",
    target: `popup-${threadId}`,
    placement: "bottom",
  };

  function startRenamingThread() {
    // @TODO: trigger the parent component to start renaming the thread
  }

  function deleteThread() {
    client.delete(apiRoutes.thread(threadId)).then(() => {
      console.log("Thread deleted");
    });
    threadsStore.update((threads) => {
      return threads.filter((t) => t.id !== threadId);
    });
    goto("/");
  }
</script>

{#if showOpenButton}
  <button use:popup={popupSettings}
    ><Icon src={EllipsisVertical} micro class="w-4 mr-4" /></button
  >
{/if}

<Portal>
  <div class="card shadow-xl z-10" data-popup={`popup-${threadId}`}>
    <div class="btn-group-vertical variant-filled">
      <!--
      <button on:click={startRenamingThread}>Rename</button>
      -->
      <button on:click={deleteThread}>Delete</button>
    </div>
    <div class="arrow variant-filled" />
  </div>
</Portal>
