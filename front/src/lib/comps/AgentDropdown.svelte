<script lang="ts">
  import { threadsStore } from "$lib/stores/threadStore";
  import { client } from "$lib/tools/client";
  import type { AppConfig } from "@shared/models";
  import { apiRoutes } from "@shared/apiRoutes";
  import { ChevronDown, Icon } from "svelte-hero-icons";
  import { popup } from "@skeletonlabs/skeleton";
  import type { PopupSettings } from "@skeletonlabs/skeleton";
  import { visibleAgentConfigStore } from "$lib/stores/agentStore";

  export let threadId: string;

  let agent: AppConfig;

  const popupClick: PopupSettings = {
    event: "click",
    target: "agent-dropdown-popup",
    placement: "top",
  };

  $: {
    const thread = $threadsStore.find((t) => t.id === threadId);
    if (thread) {
      client.get(apiRoutes.appConfig(thread.appId)).then((res) => {
        agent = res.data as AppConfig;
      });
    }
  }

  async function changeAgentConfig(agentId: string) {
    agent = $visibleAgentConfigStore.find((c) => c.id === agentId) as AppConfig;
    await client.post(apiRoutes.thread(threadId), { agentId });
  }
</script>

{#if agent}
  <button class="btn btn-sm variant-ringed" use:popup={popupClick}
    >{agent.name} <Icon src={ChevronDown} mini class="w-6" /></button
  >
{:else}
  <button class="btn" disabled>...</button>
{/if}

<div class="card shadow-xl z-10" data-popup="agent-dropdown-popup">
  <div class="arrow variant-filled" />
  <div class="btn-group-vertical variant-filled">
    {#each $visibleAgentConfigStore as config (config.id)}
      <button
        class="btn"
        data-agent-id={config.id}
        on:click={() => changeAgentConfig(config.id)}
      >
        {config.name}
      </button>
    {/each}
  </div>
</div>
