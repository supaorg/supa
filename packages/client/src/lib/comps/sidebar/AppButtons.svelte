<script lang="ts">
  import { spaceStore } from "$lib/spaces/spaces.svelte";
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

  $effect(() => {
    if (currentSpace === spaceStore.currentSpace) {
      return;
    }

    appConfigUnobserve?.();
    currentSpace = spaceStore.currentSpace;

    console.log("currentSpace", currentSpace);

    appConfigUnobserve = currentSpace?.appConfigs.observe((configs) => {
      appConfigs = configs;
    });

    return () => {
      appConfigUnobserve?.();
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
