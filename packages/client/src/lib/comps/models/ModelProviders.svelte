<script lang="ts">
  import type { ModelProvider } from "@supa/core";
  import ModelProviderCard from "./ModelProviderCard.svelte";
  import CustomProviderCard from "./CustomProviderCard.svelte";
  import AddCustomProviderCard from "./AddCustomProviderCard.svelte";
  import { providers } from "@supa/core";
  import { clientState } from "@supa/client/state/clientState.svelte";
  import { getActiveProviders } from "@supa/core";

  let customProviders = $state<ModelProvider[]>([]);

  let {
    onConnect,
    onDisconnect,
  }: {
    onConnect?: (provider: ModelProvider) => void;
    onDisconnect?: (provider: ModelProvider) => void;
  } = $props();

  function onHow(provider: ModelProvider) {
    clientState.layout.swins.open(
      "how-to-setup-model-provider",
      { provider },
      provider.name,
    );
  }

  function refreshCustomProviders() {
    if (!clientState.currentSpace) return;

    const customConfigs = clientState.currentSpace.getCustomProviders();
    // Get all active providers (built-in + custom)
    const allProviders = getActiveProviders(customConfigs);
    // Filter to just the custom ones
    customProviders = allProviders.filter((p) => p.isCustom);
  }

  // Load custom providers on mount and when space changes
  $effect(() => {
    if (clientState.currentSpace) {
      refreshCustomProviders();
    }
  });

  function handleCustomProviderAdded() {
    refreshCustomProviders();
  }

  function handleCustomProviderDeleted() {
    refreshCustomProviders();
  }
</script>

<div class="relative">
  <div class="grid grid-cols-1 gap-2">
    {#each providers as provider (provider.id)}
      <ModelProviderCard {provider} {onConnect} {onDisconnect} {onHow} />
    {/each}

    {#each customProviders as provider (provider.id)}
      <CustomProviderCard
        {provider}
        {onConnect}
        {onDisconnect}
        onDeleted={handleCustomProviderDeleted}
      />
    {/each}

    <AddCustomProviderCard onProviderAdded={handleCustomProviderAdded} />
  </div>
</div>
