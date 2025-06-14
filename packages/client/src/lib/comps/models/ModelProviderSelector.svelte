<script lang="ts">
  import type { ModelProvider, ModelProviderConfig } from "@core/models";
  import { onMount } from "svelte";
  import ModelSelectCard from "./ModelSelectCard.svelte";
  import AutoModelSelectCard from "./AutoModelSelectCard.svelte";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import { getActiveProviders } from "@core/customProviders";
  import { splitModelString, combineModelString } from "@core/utils/modelUtils";

  let {
    selectedModel,
    onModelSelect,
  }: {
    selectedModel: string | null;
    onModelSelect: (model: string) => void;
  } = $props();

  let setupProviders: {
    provider: ModelProvider;
    config: ModelProviderConfig;
  }[] = $state([]);

  type SelectedPair = {
    providerId: string;
    model: string;
  };

  let selectedPair: SelectedPair | null = $state(null);

  onMount(async () => {
    const configs = spaceStore.currentSpace?.getModelProviderConfigs();
    if (!configs) return;

    // Get custom providers
    const customProviders = spaceStore.currentSpace?.getCustomProviders() || [];
    
    // Get all active providers (built-in + custom)
    const allProviders = getActiveProviders(customProviders);

    // Process all providers
    setupProviders = allProviders
      .map(provider => {
        // For custom providers, config should already exist in the configs array
        // because custom providers are saved as provider configs
        const config = configs.find(config => config.id === provider.id);
        
        if (!config) {
          return null; // Skip providers without configs
        }
        
        return {
          provider,
          config,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    console.log("setupProviders", setupProviders);

    if (selectedModel) {
      const modelParts = splitModelString(selectedModel);
      if (modelParts) {
        selectedPair = { 
          providerId: modelParts.providerId, 
          model: modelParts.modelId 
        };
      }
    }
  });

  function getPairString(pair: SelectedPair) {
    // Special case for "auto" models - they don't have a model ID
    if (pair.providerId === "auto") {
      return "auto";
    }
    return combineModelString(pair.providerId, pair.model);
  }

  function onSelect(providerId: string, model: string) {
    selectedPair = { providerId, model };

    selectedModel = getPairString(selectedPair);
    onModelSelect(selectedModel);
  }
</script>

<div class="grid grid-cols-1 gap-2">
  {#if setupProviders.length > 0}
    <AutoModelSelectCard
      selected={selectedPair?.providerId === "auto"}
      {onSelect}
    />
  {/if}
  {#each setupProviders as setup (setup.provider.id)}
    <ModelSelectCard
      provider={setup.provider}
      config={setup.config}
      {onSelect}
      selected={selectedPair?.providerId === setup.provider.id}
      modelId={selectedPair?.providerId === setup.provider.id
        ? selectedPair.model
        : null}
    />
  {/each}
</div>
