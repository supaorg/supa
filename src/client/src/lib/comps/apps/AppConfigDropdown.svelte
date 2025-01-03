<script lang="ts">
  import type { AppConfig } from "@shared/models";
  import { ChevronDown } from "lucide-svelte";
  import { popup } from "@skeletonlabs/skeleton";
  import type { PopupSettings } from "@skeletonlabs/skeleton";
  import { onMount } from "svelte";
  import { ChatAppData } from "@shared/spaces/ChatAppData";
  import { currentSpaceStore } from "$lib/spaces/spaceStore";

  let { data }: { data: ChatAppData } = $props();

  let visibleAppConfigs = $state<AppConfig[]>([]);
  let appConfig = $state<AppConfig | undefined>(undefined);

  const popupClick: PopupSettings = {
    event: "click",
    target: "app-config-dropdown-popup",
    placement: "top",
  };

  onMount(() => {
    const unobserve = $currentSpaceStore?.appConfigs.observe((configs) => {
      visibleAppConfigs = configs.filter((config) => config.visible);
    });

    if (data.configId) {
      appConfig = $currentSpaceStore?.getAppConfig(data.configId);
    }

    return () => {
      unobserve?.();
    };
  });

  async function changeAppConfig(appConfigId: string) {
    data.configId = appConfigId;
    appConfig = $currentSpaceStore?.getAppConfig(appConfigId);
  }
</script>

{#if appConfig}
  <button class="btn btn-sm variant-ringed" use:popup={popupClick}
    >{appConfig.name} <ChevronDown size={16} /></button
  >
{:else}
  <button class="btn" disabled>...</button>
{/if}

<div class="card shadow-xl z-10" data-popup="app-config-dropdown-popup">
  <div class="arrow variant-filled"></div>
  <div class="btn-group-vertical variant-filled">
    {#each visibleAppConfigs as config (config.id)}
      <button
        class="btn"
        data-agent-id={config.id}
        onclick={() => changeAppConfig(config.id)}
      >
        {config.name}
      </button>
    {/each}
  </div>
</div>
