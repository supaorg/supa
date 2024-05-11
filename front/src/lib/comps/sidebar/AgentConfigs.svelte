<script lang="ts">
  import { getModalStore } from "@skeletonlabs/skeleton";
  import { Icon, PencilSquare, SquaresPlus } from "svelte-hero-icons";
  import { agentConfigStore } from "$lib/stores/agentStore";
  import type { AgentConfig } from "@shared/models";

  const modalStore = getModalStore();

  let visibleConfigs: AgentConfig[] = [];

  agentConfigStore.subscribe((configs) => {
    // Filter out configs with the same IDs
    configs = configs.filter((config, index, self) => {
      return index === self.findIndex((t) => (
        t.id === config.id
      ));
    });

    visibleConfigs = configs.filter((config) => { 
      if (config.meta && config.meta.visible === "false") {
        return false;
      }

      return true;
    });
  });

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

{#each visibleConfigs as config (config.id)}
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
    <span class="flex-grow text-left">{config.button}</span>
  </button>
{/each}
