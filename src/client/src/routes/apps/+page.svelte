<script lang="ts">
  import CenteredPage from "$lib/comps/basic/CenteredPage.svelte";
  import AppConfigTableCell from "$lib/comps/app-configs/AppConfigTableCell.svelte";
  import { txtStore } from "$lib/stores/txtStore";

  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import { onMount } from "svelte";
  import type { AppConfig } from "@shared/models";

  let appConfigs: AppConfig[] = [];

  onMount(() => {
    appConfigs = $currentSpaceStore?.getAppConfigs() || [];
  });
</script>

<CenteredPage>
  <h2 class="h2 pb-6">{$txtStore.appPage.title}</h2>
  <div class="card p-4 space-y-4 mb-4">
    <h3 class="h3">Chats</h3>
    <table class="table-auto w-full">
      <tbody>
        {#each appConfigs as config (config.id)}
          <AppConfigTableCell {config} />
        {/each}
      </tbody>
    </table>

    <a href="/apps/new-config" class="btn mt-2 variant-ringed-primary"
      >{$txtStore.appPage.buttonNewConfig}</a
    >
  </div>
  <div class="card p-4">
    An ability to create other types of apps is coming at some point. Write at <a
      class="anchor"
      href="mailto:hi@supa.cloud">hi@supa.cloud</a
    > if you have ideas or suggestions for an app.
  </div>
</CenteredPage>
