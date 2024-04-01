<script lang="ts">
  import { onMount } from "svelte";
  import { getModalStore } from "@skeletonlabs/skeleton";
  import ThreadsInSidebar from "./ThreadsInSidebar.svelte";
  import { Icon, PencilSquare } from "svelte-hero-icons";

  const modalStore = getModalStore();

  onMount(async () => {});

  function openNewThreadModal() {
    modalStore.trigger({
      type: "component",
      component: "newThread",
    });
  }
</script>

<div class="space-y-4 p-4">
  <button
    class="btn variant-filled w-full flex items-center justify-center"
    on:click={openNewThreadModal}
  >
    <span class="flex-grow text-left">New chat</span>
    <span><Icon src={PencilSquare} micro class="w-4" /></span>
  </button>

  <ThreadsInSidebar />
</div>
