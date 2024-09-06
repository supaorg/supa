<script lang="ts">
  import type { AppConfig } from "@shared/models";
  import { apiRoutes } from "@shared/apiRoutes";
  import { ChevronDown, Icon } from "svelte-hero-icons";
  import { popup } from "@skeletonlabs/skeleton";
  import type { PopupSettings } from "@skeletonlabs/skeleton";
  import { visibleAppConfigStore } from "$lib/stores/appConfigStore";
  import { onMount } from "svelte";
  import { currentWorkspaceOnClientStore } from "$lib/stores/workspaceStore";
  import { get } from "svelte/store";

  export let threadId: string;

  let appConfig: AppConfig | null;

  const popupClick: PopupSettings = {
    event: "click",
    target: "app-config-dropdown-popup",
    placement: "top",
  };

  onMount(async () => {
    const workspace = get(currentWorkspaceOnClientStore);
    if (workspace) {
      appConfig = await workspace.getAppConfigs(threadId);
    }
  });

  $: {
    //
  }

  async function changeAppConfig(appConfigId: string) {
    const workspace = get(currentWorkspaceOnClientStore);
    if (workspace) {
      // @TODO: change app config
      await workspace.changeAppConfig(threadId, appConfigId);
    }
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
