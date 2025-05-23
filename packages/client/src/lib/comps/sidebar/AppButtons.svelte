<script lang="ts">
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import type { AppConfig } from "@core/models";
  import { LayoutGrid, MessageCircle } from "lucide-svelte";
  import SwinsNavButton from "$lib/swins/SwinsNavButton.svelte";
  import { txtStore } from "$lib/stores/txtStore";

  let appConfigs = $state<AppConfig[]>([]);
  let appConfigUnobserve: (() => void) | undefined;

  $effect(() => {
    appConfigUnobserve = spaceStore.currentSpace?.appConfigs.observe(
      (configs) => {
        appConfigs = configs;
      }
    );

    return () => {
      appConfigUnobserve?.();
    };
  });
</script>

<ul class="space-y-1">
  {#each appConfigs as config (config.id)}
    {#if config.visible}
      <li>
        <SwinsNavButton
          component="new-thread"
          title="New conversation"
          props={{ appConfig: config }}
          className="w-full flex gap-2 flex-grow py-1 px-1 truncate flex rounded hover:preset-tonal"
        >
          <span class="flex-shrink-0 w-6 h-6">
            <span class="relative flex h-full items-center justify-center">
              <MessageCircle size={18} />
            </span>
          </span>
          <span class="flex-grow text-left">{config.name}</span>
        </SwinsNavButton>
      </li>
    {/if}
  {/each}
  <li>
    <SwinsNavButton
    component="apps"
    title="Assistants"
    className="w-full flex gap-2 flex-grow py-1 px-1 truncate flex rounded hover:preset-tonal"
  >
    <span class="w-6 h-6 flex-shrink-0">
      <span class="relative flex h-full items-center justify-center">
        <LayoutGrid size={18} />
      </span>
    </span>
    <span class="flex-grow text-left">{$txtStore.basics.apps}</span>
  </SwinsNavButton>
  </li>
</ul>
