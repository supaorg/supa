<script lang="ts">
  import type { ModelProvider, ModelProviderConfig } from "@core/models";
  import { onMount } from "svelte";
  import { getProviderModels } from "@core/tools/providerModels";

  let {
    provider,
    config,
    selected,
    onSelect,
    modelId = $bindable(),
  }: {
    provider: ModelProvider;
    config: ModelProviderConfig;
    selected: boolean;
    onSelect: (providerId: string, model: string) => void;
    modelId: string | null;
  } = $props();
  
  let prevSelectedModelId: string | null = null;
  let models = $state<string[]>([]);
  let showModels = $state(false);

  onMount(async () => {
    models = await getProviderModels(
      provider.id,
      config.type !== "cloud" ? "" : config.apiKey,
    );
  });

  function onProviderClick() {
    if (selected) {
      return;
    }

    if (modelId === null) {
      if (prevSelectedModelId && models.includes(prevSelectedModelId)) {
        modelId = prevSelectedModelId;
      } else if (
        provider.defaultModel &&
        models.includes(provider.defaultModel)
      ) {
        modelId = provider.defaultModel;
      } else {
        modelId = models[0];
      }
    }

    onSelect(provider.id, modelId);
  }

  function onChangeModel(model: string) {
    onSelect(provider.id, model);
    modelId = model;
    prevSelectedModelId = model;
    showModels = false;
  }
</script>

<div
  class="rounded-token {selected
    ? 'border border-primary-200-700-token'
    : 'border border-surface-300-600-token'}"
>
  <button
    class="flex p-4 gap-4 items-center cursor-pointer w-full"
    onclick={onProviderClick}
  >
    <div
      class="w-8 h-8 bg-white flex items-center justify-center rounded-token"
    >
      <img class="w-5/6" src={provider.logoUrl} alt={provider.name} />
    </div>
    <div class="flex flex-col space-y-4">
      <div>
        <span class="font-semibold">
          {provider.name}
        </span>
        {#if selected && !showModels}
          <span class="font-semibold">
            — {modelId}&nbsp;
          </span>
          <button
            class="btn btn-sm variant-filled"
            onclick={() => (showModels = true)}>Change</button
          >
        {/if}
      </div>
    </div>
  </button>
  <div>
    {#if selected}
      {#if showModels}
        <div class="p-4">
          <select class="select" size={models.length}>
            {#each models as model}
              <option value={model}>{model}</option>
            {/each}
          </select>
        </div>
      {/if}
    {/if}
  </div>
</div>
