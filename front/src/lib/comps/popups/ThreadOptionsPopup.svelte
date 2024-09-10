<script lang="ts">
  import { EllipsisVertical, Icon } from "svelte-hero-icons";
  import type { PopupSettings } from "@skeletonlabs/skeleton";
  import { popup } from "@skeletonlabs/skeleton";
  import Portal from "svelte-portal";
  import { goto } from "$app/navigation";
  import { currentWorkspaceStore } from "$lib/stores/workspaceStore";

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

  async function deleteThread() {
    if ($currentWorkspaceStore) {
      await $currentWorkspaceStore.deleteThread(threadId);
    }
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
