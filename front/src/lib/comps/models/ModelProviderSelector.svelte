<script lang="ts">
  import { client } from "$lib/tools/client";
  import type { ModelProvider } from "@shared/models";
  import { onMount } from "svelte";
  import ModelSelectCard from "./ModelSelectCard.svelte";

  let providers: ModelProvider[] = [];

  export let selectedModel: string | null = null;

  export let onModelSelect: (model: string) => void = () => {};

  type SelectedPair = {
    providerId: string;
    model: string;
  };

  let selectedPair: SelectedPair | null = null;

  onMount(async () => {
    providers = await client
      .get("providers")
      .then((res) => res.data as ModelProvider[]);

    if (selectedModel) {
      const [providerId, model] = selectedModel.split("/");
      selectedPair = { providerId, model };
    }
  });

  function getPairString(pair: SelectedPair) {
    return pair.providerId + '/' + pair.model;
  }

  function onSelect(providerId: string, model: string) {
    selectedPair = { providerId, model };

    selectedModel = getPairString(selectedPair);
    onModelSelect(selectedModel);
  }
</script>

<div class="grid grid-cols-1 gap-4">
  {#each providers as provider (provider.id)}
    <ModelSelectCard {provider} {onSelect} selected={selectedPair?.providerId === provider.id} />
  {/each}
</div>
