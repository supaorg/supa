<script lang="ts">
  import { client } from "$lib/tools/client";
  import type { ModelProvider, ModelProviderConfig } from "@shared/models";
  import { onMount } from "svelte";
  import ModelSelectCard from "./ModelSelectCard.svelte";
  import { routes } from "@shared/routes/routes";
  import AutoModelSelectCard from "./AutoModelSelectCard.svelte";

  let providers: ModelProvider[] = [];
  let configs: ModelProviderConfig[] = [];

  export let selectedModel: string | null = null;

  export let onModelSelect: (model: string) => void = () => {};

  type SelectedPair = {
    providerId: string;
    model: string;
  };

  let selectedPair: SelectedPair | null = null;

  onMount(async () => {
    const [providersResponse, configsResponse] = await Promise.all([
      client.get(routes.providers),
      client.get(routes.providerConfigs),
    ]);

    providers = providersResponse.data as ModelProvider[];
    configs = configsResponse.data as ModelProviderConfig[];

    // Keep the providers that are setup
    providers = providers.filter((provider) =>
      configs.some((config) => config.id === provider.id),
    );

    if (selectedModel) {
      const [providerId, model] = selectedModel.split("/");
      selectedPair = { providerId, model };
    }
  });

  function getPairString(pair: SelectedPair) {
    return pair.providerId + "/" + pair.model;
  }

  function onSelect(providerId: string, model: string) {
    selectedPair = { providerId, model };

    selectedModel = getPairString(selectedPair);
    onModelSelect(selectedModel);
  }
</script>

<div class="grid grid-cols-1 gap-4">
  {#if providers.length > 0}
    <AutoModelSelectCard
      selected={selectedPair?.providerId === "auto"}
      {onSelect}
    />
  {/if}
  {#each providers as provider (provider.id)}
    <ModelSelectCard
      {provider}
      {onSelect}
      selected={selectedPair?.providerId === provider.id}
      modelId={selectedPair?.providerId === provider.id
        ? selectedPair.model
        : null}
    />
  {/each}
</div>
