<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import type { AppConfig } from "@core/models";
  import Pen from "lucide-svelte/icons/pen";
  import { onMount } from "svelte";
  import { Modal } from "@skeletonlabs/skeleton-svelte";
  import NewThreadPopup from "../popups/NewThreadPopup.svelte";
  import type Space from "@core/spaces/Space";

  let newThreadModalIsOpen = $state(false);
  let targetAppConfig = $state<AppConfig | undefined>(undefined);
  let appConfigs = $state<AppConfig[]>([]);
  let currentSpace = $state<Space | null>(null);
  let appConfigUnobserve: (() => void) | undefined;

  function startNewThread(appConfig: AppConfig) {
    newThreadModalIsOpen = true;
    targetAppConfig = appConfig;
  }

  onMount(() => {
    const currentSpaceSub = currentSpaceStore.subscribe((space) => {
      if (currentSpace === space) {
        return;
      }

      appConfigUnobserve?.();

      currentSpace = space;

      appConfigUnobserve = currentSpace?.appConfigs.observe((configs) => {
        appConfigs = configs;
      });
    });

    return () => {
      appConfigUnobserve?.();
      currentSpaceSub?.();
    };
  });
</script>

<ul>
  {#each appConfigs as config (config.id)}
    {#if config.visible}
      <li>
        <button
          class="w-full flex px-2 py-2 gap-2 rounded hover:bg-surface-100-900"
          onclick={() => startNewThread(config)}
        >
          <span class="flex-shrink-0 w-6 h-6">
            <span class="relative flex h-full items-center justify-center">
              <Pen size={18} />
            </span>
          </span>
          <span class="flex-grow text-left">{config.name}</span>
        </button>
      </li>
    {/if}
  {/each}
</ul>

<Modal
  bind:open={newThreadModalIsOpen}
  contentBase="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-screen-sm min-w-[400px] max-h-screen overflow-y-auto"
  backdropClasses="backdrop-blur-sm"
  triggerBase="hidden"
>
  {#snippet content()}
    {#if targetAppConfig}
      <NewThreadPopup
        appConfig={targetAppConfig}
        onRequestClose={() => (newThreadModalIsOpen = false)}
      />
    {:else}
      <div>No app config selected</div>
    {/if}
  {/snippet}
</Modal>
