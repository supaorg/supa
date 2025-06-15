<script lang="ts">
  import { onMount } from "svelte";
  import type { ModelProvider, ModelProviderConfig } from "@core/models";
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
  let customModelInput = $state("");
  
  // Check if this is a custom provider
  const isCustomProvider = $derived(provider.isCustom === true);
  // Check if this is OpenRouter provider
  const isOpenRouterProvider = $derived(provider.id === "openrouter");
  // For custom providers, get the model ID from the config
  const customModelId = $derived(isCustomProvider && 'modelId' in config ? config.modelId as string : null);

  onMount(async () => {
    // Only fetch models for non-custom providers and non-OpenRouter providers
    if (!isCustomProvider && !isOpenRouterProvider) {
      models = await getProviderModels(
        provider.id,
        config.type !== "cloud" ? "" : config.apiKey,
      );
    }
    
    // Initialize custom model input for OpenRouter
    if (isOpenRouterProvider && modelId) {
      customModelInput = modelId;
    }
  });

  function onProviderClick() {
    if (selected) {
      return;
    }

    if (isCustomProvider && customModelId) {
      // For custom providers, use the model ID from the config
      modelId = customModelId;
      onSelect(provider.id, modelId);
      return;
    }

    if (isOpenRouterProvider) {
      // For OpenRouter, use the custom input or default model
      modelId = customModelInput || provider.defaultModel || "";
      onSelect(provider.id, modelId);
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
      } else if (models.length > 0) {
        modelId = models[0];
      } else {
        modelId = provider.defaultModel || "";
      }
    }

    onSelect(provider.id, modelId || "");
  }

  function onChangeModel(model: string) {
    const finalModel = model === "auto" && provider.defaultModel ? provider.defaultModel : model;
    onSelect(provider.id, finalModel);
    modelId = finalModel;
    prevSelectedModelId = finalModel;
    showModels = false;
  }

  function onCustomModelInputChange() {
    modelId = customModelInput;
    onSelect(provider.id, customModelInput);
  }

  function onCustomModelKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      onCustomModelInputChange();
    }
  }
</script>

<div
  class="rounded {selected
    ? 'border border-primary-500'
    : 'border border-surface-500'}"
>
  <div
    role="button"
    tabindex="0"
    class="flex p-2 gap-4 items-center cursor-pointer w-full"
    onclick={onProviderClick}
    onkeydown={(e) => e.key === "Enter" && onProviderClick()}
  >
    <div class="w-8 h-8 bg-white flex items-center justify-center rounded">
      <img class="w-5/6" src={provider.logoUrl} alt={provider.name} />
    </div>
    <div class="flex-1">
      <span class="font-semibold">
        {provider.name}
      </span>
      {#if isCustomProvider && customModelId}
        <span class="font-semibold">
          — {customModelId}&nbsp;
        </span>
      {:else if selected && !showModels && modelId && modelId !== provider.defaultModel}
        <span class="font-semibold">
          — {modelId}&nbsp;
        </span>
      {/if}
    </div>
    {#if selected && !isCustomProvider}
      {#if isOpenRouterProvider}
        <button
          class="btn btn-sm preset-filled-primary-500"
          onclick={() => (showModels = true)}
          >Enter model</button
        >
      {:else}
        {#if !showModels}
          <button
            class="btn btn-sm preset-filled-primary-500"
            onclick={() => (showModels = true)}
            >{!modelId || modelId === provider.defaultModel
              ? "Choose model"
              : "Change"}</button
          >
        {:else}
          <button
            class="btn btn-sm preset-filled-primary-500"
            onclick={() => (showModels = false)}>Done</button
          >
        {/if}
      {/if}
    {/if}
  </div>
  <div>
    {#if selected && !isCustomProvider}
      {#if showModels}
        <div class="p-2 space-y-4">
          {#if isOpenRouterProvider}
            <div class="space-y-2">
              <label class="label">
                <span class="text-sm font-medium">Model Name</span>
                <input
                  class="input rounded-container"
                  type="text"
                  placeholder="e.g., openai/gpt-4o, anthropic/claude-3-5-sonnet"
                  bind:value={customModelInput}
                  oninput={onCustomModelInputChange}
                  onkeydown={onCustomModelKeydown}
                />
              </label>
              <p class="text-xs text-surface-500">
                Enter any model available on OpenRouter (e.g., openai/gpt-4o, anthropic/claude-3-5-sonnet, meta-llama/llama-3.2-90b-vision-instruct)
              </p>
              <button
                class="btn btn-sm preset-filled-primary-500"
                onclick={() => (showModels = false)}>Done</button
              >
            </div>
          {:else}
            <select
              class="select rounded-container"
              size={provider.defaultModel ? models.length : models.length + 1}
              value={!modelId || modelId === provider.defaultModel
                ? "auto"
                : modelId}
              onchange={(e) => onChangeModel(e.currentTarget.value)}
            >
              <option value="auto"
                >{provider.defaultModel || "Auto"} (default)</option
              >
              {#each models.filter((model) => model !== provider.defaultModel && model) as model}
                <option value={model}>{model}</option>
              {/each}
            </select>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>
