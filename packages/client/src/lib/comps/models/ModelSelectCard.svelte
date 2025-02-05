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
</script>

<div
  class="rounded {selected
    ? 'border border-primary-500'
    : 'border border-surface-500'}"
>
  <div
    role="button"
    tabindex="0"
    class="flex p-4 gap-4 items-center cursor-pointer w-full"
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
      {#if selected && !showModels && modelId && modelId !== provider.defaultModel}
        <span class="font-semibold">
          — {modelId}&nbsp;
        </span>
      {/if}
    </div>
    {#if selected}
      {#if !showModels}
        <button
          class="btn btn-sm preset-outlined-surface-500"
          onclick={() => (showModels = true)}
          >{!modelId || modelId === provider.defaultModel
            ? "Choose model"
            : "Change"}</button
        >
      {:else}
        <button
          class="btn btn-sm preset-outlined-surface-500"
          onclick={() => (showModels = false)}>Done</button
        >
      {/if}
    {/if}
  </div>
  <div>
    {#if selected}
      {#if showModels}
        <div class="p-4 space-y-4">
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
        </div>
      {/if}
    {/if}
  </div>
</div>
