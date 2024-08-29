<script lang="ts">
  import { threadsStore } from "$lib/stores/threadStore";
  import { client } from "$lib/tools/client";
  import type { AppConfig } from "@shared/models";
  import { apiRoutes } from "@shared/apiRoutes";
  import { ChevronDown, Icon } from "svelte-hero-icons";
  import { popup } from "@skeletonlabs/skeleton";
  import type { PopupSettings } from "@skeletonlabs/skeleton";
  import { visibleAppConfigStore } from "$lib/stores/appConfigStore";
  import { getCurrentWorkspaceId } from "$lib/stores/workspaceStore";

  export let threadId: string;

  let appConfig: AppConfig | null;

  const popupClick: PopupSettings = {
    event: "click",
    target: "app-config-dropdown-popup",
    placement: "top",
  };

  $: {
    const thread = $threadsStore.find((t) => t.id === threadId);
    if (thread && thread.appConfigId) {
      client
        .get(apiRoutes.appConfig(getCurrentWorkspaceId(), thread.appConfigId))
        .then((res) => {
          appConfig = res.data as AppConfig;
        });
    } else {
      appConfig = null;
    }
  }

  async function changeAppConfig(appConfigId: string) {
    appConfig = $visibleAppConfigStore.find((c) => c.id === appConfigId) as AppConfig;
    await client.post(apiRoutes.thread(getCurrentWorkspaceId(), threadId), { agentId: appConfigId });
  }
</script>

{#if appConfig}
  <button class="btn btn-sm variant-ringed" use:popup={popupClick}
    >{appConfig.name} <Icon src={ChevronDown} mini class="w-6" /></button
  >
{:else}
  <button class="btn" disabled>...</button>
{/if}

<div class="card shadow-xl z-10" data-popup="app-config-dropdown-popup">
  <div class="arrow variant-filled" />
  <div class="btn-group-vertical variant-filled">
    {#each $visibleAppConfigStore as config (config.id)}
      <button
        class="btn"
        data-agent-id={config.id}
        on:click={() => changeAppConfig(config.id)}
      >
        {config.name}
      </button>
    {/each}
  </div>
</div>
