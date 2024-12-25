<script lang="ts">
  import type { AppConfig } from "@shared/models";
  import { ChevronDown } from "lucide-svelte";
  import { popup } from "@skeletonlabs/skeleton";
  import type { PopupSettings } from "@skeletonlabs/skeleton";
  import { get } from "svelte/store";
  import { onMount } from "svelte";
  import { ChatAppData } from "@shared/spaces/ChatAppData";

  let { data }: { data: ChatAppData } = $props();

  let visibleAppConfigs: AppConfig[] = [];

  let appConfig: AppConfig | null;

  const popupClick: PopupSettings = {
    event: "click",
    target: "app-config-dropdown-popup",
    placement: "top",
  };

  onMount(async () => {
    /*
    visibleAppConfigs = $appConfigsStore.filter((config) =>
      config.meta ? config.meta.visible : false,
    );
    */

    /*
    if (!$threadsStore || $threadsStore.length === 0) {
      return;
    }

    const thread = $threadsStore.find((t) => t.id === threadId);

    if (!thread) {
      return;
    }

    appConfig = (await $currentWorkspaceStore?.getAppConfig(
      thread.appConfigId,
    )) as AppConfig | null;
    */
  });

  async function changeAppConfig(appConfigId: string) {
    /*
    if ($currentWorkspaceStore) {
      // @TODO: change app config
      await $currentWorkspaceStore.changeAppConfig(threadId, appConfigId);
    }
    */
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
