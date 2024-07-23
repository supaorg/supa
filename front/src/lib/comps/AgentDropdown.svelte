<script lang="ts">
  import { threadsStore } from "$lib/stores/threadStore";
  import { client } from "$lib/tools/client";
  import type { AgentConfig } from "@shared/models";
  import { routes } from "@shared/routes/routes";
  import { ChevronDown, Icon } from "svelte-hero-icons";
  import { popup } from "@skeletonlabs/skeleton";
  import type { PopupSettings } from "@skeletonlabs/skeleton";
  import { visibleAgentConfigStore } from "$lib/stores/agentStore";

  export let threadId: string;

  let agent: AgentConfig;

  const popupClick: PopupSettings = {
    event: "click",
    target: "agent-dropdown-popup",
    placement: "top",
  };

  $: {
    const thread = $threadsStore.find((t) => t.id === threadId);
    if (thread) {
      client.get(routes.appConfig(thread.agentId)).then((res) => {
        agent = res.data as AgentConfig;
      });
    }
  }

  async function changeAgentConfig(agentId: string) {
    agent = $visibleAgentConfigStore.find((c) => c.id === agentId) as AgentConfig;
    await client.post(routes.thread(threadId), { agentId });
  }
</script>

{#if agent}
  <button class="btn btn-sm variant-ringed" use:popup={popupClick}
    >{agent.name} <Icon src={ChevronDown} mini class="w-6" /></button
  >
{:else}
  <button class="btn" disabled>...</button>
{/if}

<div class="card variant-filled-surface" data-popup="agent-dropdown-popup">
  <div class="arrow variant-filled-surface" />
  <div class="btn-group-vertical">
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
