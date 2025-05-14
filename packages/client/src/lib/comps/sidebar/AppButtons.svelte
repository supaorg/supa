<script lang="ts">
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import type { AppConfig } from "@core/models";
  import { MessageCircle } from "lucide-svelte";
  import SwinsNavButton from "$lib/swins/SwinsNavButton.svelte";

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

<ul>
  {#each appConfigs as config (config.id)}
    {#if config.visible}
      <li>
        <SwinsNavButton
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
        </SwinsNavButton>
      </li>
    {/if}
  {/each}
</ul>
