<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import type { AppConfig } from "@core/models";
  import Pen from "lucide-svelte/icons/pen";
  import { MessageCircle } from "lucide-svelte";
  import { onMount } from "svelte";
  import { Modal } from "@skeletonlabs/skeleton-svelte";
  import NewThreadPopup from "../../spages/routes/NewThread.svelte";
  import type Space from "@core/spaces/Space";
  import SpagesNavButton from "$lib/spages/SpagesNavButton.svelte";

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
        <SpagesNavButton
          component="new-thread"
          title="New conversation"
          props={{ appConfig: config }}
          className="w-full flex gap-2 flex-grow py-2 px-2 truncate flex rounded hover:preset-tonal"
        >
          <span class="flex-shrink-0 w-6 h-6">
            <span class="relative flex h-full items-center justify-center">
              <MessageCircle size={18} />
            </span>
          </span>
          <span class="flex-grow text-left">{config.name}</span>
        </SpagesNavButton>
      </li>
    {/if}
  {/each}
</ul>

<!--
<Modal
  open={newThreadModalIsOpen}
  onOpenChange={(e) => newThreadModalIsOpen = e.open}
  contentBase="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-screen-md min-w-[600px] max-h-screen overflow-y-auto"
  backdropClasses="backdrop-blur-sm"
  triggerBase="hidden"
  closeOnInteractOutside={true}
  closeOnEscape={true}
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
-->
