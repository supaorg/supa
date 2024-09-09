<script lang="ts">
  import type { AppConfig } from "@shared/models";
  import { ChevronDown, Icon } from "svelte-hero-icons";
  import { popup } from "@skeletonlabs/skeleton";
  import type { PopupSettings } from "@skeletonlabs/skeleton";
  import { get } from "svelte/store";
  import { onMount } from "svelte";
  import {
    currentWorkspaceAppConfigsStore,
    currentWorkspaceOnClientStore,
  } from "$lib/stores/workspaceStore";

  export let threadId: string;

  let visibleAppConfigs: AppConfig[] = [];

  $: {
    visibleAppConfigs = $currentWorkspaceAppConfigsStore.filter((config) =>
      config.meta ? config.meta.visible : false,
    );
  }

  let appConfig: AppConfig | null;

  const popupClick: PopupSettings = {
    event: "click",
    target: "app-config-dropdown-popup",
    placement: "top",
  };

  onMount(async () => {
    const threadsStore = $currentWorkspaceOnClientStore?.threads;

    if (!threadsStore) {
      return;
    }

    const thread = get(threadsStore).find((t) => t.id === threadId);

    if (!thread) {
      return;
    }

    appConfig = await $currentWorkspaceOnClientStore.getAppConfig(
      thread.appConfigId,
    );
  });

  async function changeAppConfig(appConfigId: string) {
    if ($currentWorkspaceOnClientStore) {
      // @TODO: change app config
      await $currentWorkspaceOnClientStore.changeAppConfig(
        threadId,
        appConfigId,
      );
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
    {#each visibleAppConfigs as config (config.id)}
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
