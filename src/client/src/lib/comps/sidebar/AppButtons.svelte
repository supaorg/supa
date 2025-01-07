<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import type { AppConfig } from "@shared/models";
  import Pen from "lucide-svelte/icons/pen";
  import { onMount } from "svelte";
  import { Modal } from "@skeletonlabs/skeleton-svelte";
  import NewThreadPopup from "../popups/NewThreadPopup.svelte";
  //import { getModalStore } from "@skeletonlabs/skeleton";
  //const modalStore = getModalStore();

  let newThreadModalIsOpen = $state(false);
  let targetAppConfig = $state<AppConfig | undefined>(undefined);

  function openNewThreadModal(appConfig: AppConfig) {
    console.log("openNewThreadModal", appConfig);
    newThreadModalIsOpen = true;
    targetAppConfig = appConfig;
    /*
    modalStore.trigger({
      type: "component",
      component: "newThread",
      meta: {
        appConfigId: appConfigId,
      },
    });
    */
  }

  let appConfigs = $state<AppConfig[]>([]);

  onMount(() => {
    const unobserve = $currentSpaceStore?.appConfigs.observe((configs) => {
      appConfigs = configs;
    });

    return () => {
      unobserve?.();
    };
  });
</script>

{#each appConfigs as config (config.id)}
  {#if config.visible}
    <button
      class="sidebar-btn w-full flex"
      onclick={() => openNewThreadModal(config)}
    >
      <span class="w-6 h-6 flex-shrink-0">
        <span class="relative flex h-full items-center justify-center">
          <Pen size={18} />
        </span>
      </span>
      <span class="flex-grow text-left">{config.name}</span>
    </button>
  {/if}
{/each}

<Modal
  bind:open={newThreadModalIsOpen}
  contentBase="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-screen-sm min-w-[400px] max-h-screen overflow-y-auto"
  backdropClasses="backdrop-blur-sm"
>
  {#snippet content()}
    {#if targetAppConfig}
      <NewThreadPopup appConfig={targetAppConfig} onRequestClose={() => (newThreadModalIsOpen = false)} />
    {:else}
      <div>No app config selected</div>
    {/if}
  {/snippet}
</Modal>
