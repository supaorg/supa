<script>
  import CenteredPage from "$lib/comps/basic/CenteredPage.svelte";
  import Lightswitch from "$lib/comps/basic/Lightswitch.svelte";
  import ModelProviders from "$lib/comps/models/ModelProviders.svelte";
  import { spaceStore } from "$lib/spaces/spaceStore";
  import { isDevMode } from "$lib/stores/devMode";
</script>

<CenteredPage>
  <h2 class="h2 mb-4">Settings</h2>

  <div class="flex flex-col gap-6 w-full max-w-2xl">
    <div class="card p-4 preset-filled-surface-100-900 border-[1px] border-surface-200-800">
      <h3 class="h4 mb-4">Theme</h3>
      <Lightswitch />
    </div>

    <div class="card p-4 preset-filled-surface-100-900 border-[1px] border-surface-200-800">
      <h3 class="h4 mb-4">Model Providers</h3>
      <ModelProviders />
    </div>

    <div class="card p-4 preset-filled-surface-100-900 border-[1px] border-surface-200-800">
      <h3 class="h4 mb-4">Spaces</h3>
      <p class="mb-4">You have {$spaceStore.length === 1 ? '1 space' : `${$spaceStore.length} spaces`}</p>
      <a href="/spaces" class="btn preset-filled">Manage</a>
    </div>

    <div class="card p-4 preset-filled-surface-100-900 border-[1px] border-surface-200-800">
      <h3 class="h4 mb-4">For developers</h3>
      <button class="btn preset-filled" on:click={() => $isDevMode = !$isDevMode}>Toggle Dev Mode</button>
    </div>
  </div>
</CenteredPage>
