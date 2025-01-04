<script lang="ts">
  //import { EllipsisVertical, Icon } from "svelte-hero-icons";
  import { EllipsisVertical } from "lucide-svelte";
  //import type { PopupSettings } from "@skeletonlabs/skeleton";
  //import { popup } from "@skeletonlabs/skeleton";
  import { goto } from "$app/navigation";

  let { appTreeId } : { appTreeId: string } = $props();

  /*
  const popupSettings: PopupSettings = {
    event: "click",
    target: `popup-${appTreeId}`,
    placement: "bottom",
  };
  */

  function startRenamingThread() {
    // @TODO: trigger the parent component to start renaming the thread
  }

  async function deleteThread() {
    /*
    if ($currentWorkspaceStore) {
      await $currentWorkspaceStore.deleteThread(threadId);
    }
    */
    goto("/");
  }
</script>

<button><EllipsisVertical size={18} /></button>

<!--
<Portal>
  <div class="card shadow-xl z-10" data-popup={`popup-${threadId}`}>
    <div class="btn-group-vertical variant-filled">
      <button on:click={deleteThread}>Delete</button>
    </div>
    <div class="arrow variant-filled" />
  </div>
</Portal>
-->
