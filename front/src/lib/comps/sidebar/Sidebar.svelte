<script lang="ts">
  import { onMount } from "svelte";
  import { getModalStore } from "@skeletonlabs/skeleton";
  import ThreadsInSidebar from "./ThreadsInSidebar.svelte";
  import { Icon, PencilSquare } from "svelte-hero-icons";
  import { agentStore } from "$lib/stores/agentStore";

  const modalStore = getModalStore();

  onMount(async () => {});

  function openNewThreadModal(event: any) {
    const agentId = event.currentTarget.getAttribute('data-agent-id');
    modalStore.trigger({
      type: "component",
      component: "newThread",
      meta: {
        agentId: agentId,
      },
    });
  }
</script>

<div class="space-y-4 p-4">
  {#each $agentStore as agent (agent.id)}
    <button
      class="btn variant-filled w-full flex items-center justify-center"
      data-agent-id={agent.id}
      on:click={openNewThreadModal}
    >
      <span class="flex-grow text-left">{agent.button}</span>
      <span><Icon src={PencilSquare} micro class="w-4" /></span>
    </button>
  {/each}
  <ThreadsInSidebar />
</div>
