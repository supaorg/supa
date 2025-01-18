<script>
  import CenteredPage from "$lib/comps/basic/CenteredPage.svelte";
  import Lightswitch from "$lib/comps/basic/Lightswitch.svelte";
  import ModelProviders from "$lib/comps/models/ModelProviders.svelte";
  import { spaceStore } from "$lib/spaces/spaceStore";
  import { isDevMode } from "$lib/stores/devMode";
  import { txtStore } from "$lib/stores/txtStore";

  $: spaceCount = $spaceStore.length === 1 ? "1 space" : `${$spaceStore.length} spaces`;
</script>

<CenteredPage>
  <h2 class="h2 mb-4">{$txtStore.settingsPage.title}</h2>

  <div class="flex flex-col gap-6 w-full max-w-2xl">
    <div class="card p-4 preset-filled-surface-100-900 border-[1px] border-surface-200-800">
      <h3 class="h4 mb-4">{$txtStore.settingsPage.appearance.theme}</h3>
      <Lightswitch />
    </div>

    <div class="card p-4 preset-filled-surface-100-900 border-[1px] border-surface-200-800">
      <h3 class="h4 mb-4">{$txtStore.settingsPage.providers.title}</h3>
      <ModelProviders />
    </div>

    <div class="card p-4 preset-filled-surface-100-900 border-[1px] border-surface-200-800">
      <h3 class="h4 mb-4">{$txtStore.settingsPage.spaces.title}</h3>
      <p class="mb-4">{$txtStore.settingsPage.spaces.spaceCount($spaceStore.length)}</p>
      <a href="/spaces" class="btn preset-filled">{$txtStore.settingsPage.spaces.manageButton}</a>
    </div>

    <div class="card p-4 preset-filled-surface-100-900 border-[1px] border-surface-200-800">
      <h3 class="h4 mb-4">{$txtStore.settingsPage.developers.title}</h3>
      <button class="btn preset-filled" on:click={() => $isDevMode = !$isDevMode}>{$txtStore.settingsPage.developers.toggleDevMode}</button>
    </div>
  </div>
</CenteredPage>
