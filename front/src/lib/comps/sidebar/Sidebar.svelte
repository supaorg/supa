<script lang="ts">
  import { onMount } from "svelte";
  import { getModalStore } from "@skeletonlabs/skeleton";
  import ThreadsInSidebar from "./ThreadsInSidebar.svelte";
  import { Icon, PencilSquare, SquaresPlus } from "svelte-hero-icons";
  import { agentStore } from "$lib/stores/agentStore";

  const modalStore = getModalStore();

  onMount(async () => {});

  function openNewThreadModal(event: any) {
    const agentId = event.currentTarget.getAttribute("data-agent-id");
    modalStore.trigger({
      type: "component",
      component: "newThread",
      meta: {
        agentId: agentId,
      },
    });
  }
</script>

<div class="p-2">
  {#each $agentStore as agent (agent.id)}
    <button
      class="sidebar-btn w-full flex"
      data-agent-id={agent.id}
      on:click={openNewThreadModal}
    >
      <span class="w-8 h-8 flex-shrink-0">
        <span
          class="relative flex h-full items-center justify-center rounded-full bg-white"
        >
          <Icon src={PencilSquare} micro class="text-black w-4" />
        </span>
      </span>
      <span class="flex-grow text-left">{agent.button}</span>
    </button>
  {/each}
  <a href="/agents" class="sidebar-btn w-full flex">
    <span class="w-8 h-8 flex-shrink-0">
      <span class="relative flex h-full items-center justify-center">
        <Icon src={SquaresPlus} mini class="w-6" />
      </span>
    </span>
    <span class="flex-grow text-left">Agents</span>
  </a>
  <ThreadsInSidebar />
</div>
