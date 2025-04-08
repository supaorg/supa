<script lang="ts">
  import CenteredPage from "$lib/comps/basic/CenteredPage.svelte";
  import AppConfigTableCell from "$lib/comps/app-configs/AppConfigTableCell.svelte";
  import { txtStore } from "$lib/stores/txtStore";
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import { onMount } from "svelte";
  import type { AppConfig } from "@core/models";
  import type Space from "@core/spaces/Space";

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

<CenteredPage>
  <h2 class="h2 pb-6">{$txtStore.appPage.title}</h2>
  <div class="card p-4 space-y-4 mb-4">
    <h3 class="h3">{$txtStore.appPage.chatsTitle}</h3>
    <table class="table-auto w-full">
      <tbody>
        {#each appConfigs as config (config.id)}
          <AppConfigTableCell {config} />
        {/each}
      </tbody>
    </table>

    <a href="/apps/new-config" class="btn mt-2 preset-filled-primary-500"
      >{$txtStore.appPage.buttonNewConfig}</a
    >
  </div>
  <div class="card p-4">
    {@html $txtStore.appPage.contactMessage}
  </div>
</CenteredPage>
