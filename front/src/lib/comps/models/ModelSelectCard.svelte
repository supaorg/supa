<script lang="ts">
  import { client } from "$lib/tools/client";
  import type { ModelProvider } from "@shared/models";
  import { ListBox, ListBoxItem } from "@skeletonlabs/skeleton";
  import { onMount } from "svelte";

  export let provider: ModelProvider;
  export let selected = false;
  export let onSelect: (providerId: string, model: string) => void;
  export let modelId: string | null = null;

  let models: string[] = [];
  let showModels = false;

  onMount(async () => {
    models = await client
      .get(`provider-configs/${provider.id}/models`)
      .then((res) => {
        return res.data as string[];
      });
  });

  function onProviderClick() {
    if (selected) {
      return;
    }

    onSelect(provider.id, models[0]);

    if (modelId === null) {
      modelId = models[0];
      showModels = true;
    }
  }

  function onChangeModel(model: string) {
    onSelect(provider.id, model);
    modelId = model;
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
      <span class="font-semibold">{provider.name}</span>
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
      {:else}
        <div class="p-4 flex gap-4 items-center">
          <strong>{modelId}</strong>
          <button class="btn btn-sm variant-filled" on:click={() => (showModels = true)}
            >Change</button
          >
        </div>
      {/if}
    {/if}
  </div>
</div>
