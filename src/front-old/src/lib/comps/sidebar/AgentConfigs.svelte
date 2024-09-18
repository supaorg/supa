<script lang="ts">
    import { visibleAppConfigsStore } from "$lib/stores/workspaceStore";
  import { getModalStore } from "@skeletonlabs/skeleton";
  import { Icon, PencilSquare } from "svelte-hero-icons";

  const modalStore = getModalStore();

  function openNewThreadModal(event: any) {
    const appConfigId = event.currentTarget.getAttribute("data-agent-id");
    modalStore.trigger({
      type: "component",
      component: "newThread",
      meta: {
        appConfigId: appConfigId,
      },
    });
  }
</script>

{#each $visibleAppConfigsStore as config (config.id)}
  <button
    class="sidebar-btn w-full flex"
    data-agent-id={config.id}
    on:click={openNewThreadModal}
  >
    <span class="w-8 h-8 flex-shrink-0">
      <span
        class="relative flex h-full items-center justify-center rounded-full bg-white"
      >
        <Icon src={PencilSquare} micro class="text-black w-4" />
      </span>
    </span>
    <span class="flex-grow text-left">{config.name}</span>
  </button>
{/each}
