<script lang="ts">
  import { client } from "$lib/tools/client";
  import type { ModelProvider } from "@shared/models";
  import { apiRoutes } from "@shared/apiRoutes";
  import { ListBox, ListBoxItem } from "@skeletonlabs/skeleton";
  import { onMount } from "svelte";

  export let provider: ModelProvider;
  export let selected = false;
  export let onSelect: (providerId: string, model: string) => void;
  export let modelId: string | null = null;
  let prevSelectedModelId: string | null = null;

  let models: string[] = [];
  let showModels = false;

  onMount(async () => {
    models = await client.get(apiRoutes.providerModel(provider.id)).then((res) => {
      return res.data as string[];
    });
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
    on:click={onProviderClick}
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
            on:click={() => (showModels = true)}>Change</button
          >
        {/if}
      </div>
    </div>
  </button>
  <div>
    {#if selected}
      {#if showModels}
        <div class="p-4">
          <ListBox>
            {#each models as model}
              <ListBoxItem
                bind:group={modelId}
                on:click={() => onChangeModel(model)}
                name="models"
                value={model}>{model}</ListBoxItem
              >
            {/each}
          </ListBox>
        </div>
      {/if}
    {/if}
  </div>
</div>
