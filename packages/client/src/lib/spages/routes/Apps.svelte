<script lang="ts">
  import CenteredPage from "$lib/comps/basic/CenteredPage.svelte";
  import AppConfigTableCell from "$lib/comps/app-configs/AppConfigTableCell.svelte";
  import { txtStore } from "$lib/stores/txtStore";
  import { spaceStore } from "$lib/spaces/spaces.svelte";
  import { onMount } from "svelte";
  import type { AppConfig } from "@core/models";
  import type Space from "@core/spaces/Space";
  import SpagesNavButton from "../SpagesNavButton.svelte";

  let appConfigs = $state<AppConfig[]>([]);
  let currentSpace = $state<Space | null>(null);
  let appConfigUnobserve: (() => void) | undefined;

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


<div class="card space-y-4">
  <h3 class="h3">Your Assistants</h3>
  <p>You can create and edit your chat assistants here. You will see the assistant buttons in the right top of the sidebar.</p>
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
