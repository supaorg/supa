<script lang="ts">
  import AppConfigTableCell from "$lib/comps/app-configs/AppConfigTableCell.svelte";
  import { txtStore } from "$lib/stores/txtStore";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import type { AppConfig } from "@core/models";
  import SpagesNavButton from "../SpagesNavButton.svelte";

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

<div class="card space-y-4">
  <h3 class="h3">Your Assistants</h3>
  <p>
    You can create and edit your chat assistants here. You will see the
    assistant buttons in the right top of the sidebar.
  </p>
  <div class="flex flex-col">
    {#each appConfigs as config (config.id)}
      <AppConfigTableCell {config} />
    {/each}
  </div>

  <SpagesNavButton
    component="app-config"
    title="New Config"
    className="btn preset-filled-primary-500 mb-2"
  >
    {$txtStore.appPage.buttonNewConfig}
  </SpagesNavButton>
</div>
