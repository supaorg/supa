<script lang="ts">
  import type { ModelProvider } from "@shared/models";
  import ModelProviderCard from "./ModelProviderCard.svelte";
  import { onMount } from "svelte";
  import { client } from "$lib/tools/client";
  import { routes } from "@shared/routes/routes";
  import { Icon, XCircle } from "svelte-hero-icons";

  let providers: ModelProvider[] = [];

  let showHowForProvider: ModelProvider | null = null;

  export let onConnect: (provider: ModelProvider) => void = () => {};
  export let onDisconnect: (provider: ModelProvider) => void = () => {};

  function onHow(provider: ModelProvider) {
    showHowForProvider = provider;
  }

  onMount(async () => {
    providers = await client
      .get(routes.providers)
      .then((res) => res.data as ModelProvider[]);
  });
</script>

<div class="relative">
  <div class="grid grid-cols-2 gap-4">
    {#each providers as provider (provider.id)}
      <ModelProviderCard {provider} {onConnect} {onDisconnect} {onHow} />
    {/each}
  </div>
  {#if showHowForProvider}
    <div
      class="absolute card shadow-lg w-full h-full top-0 left-0 overflow-hidden"
    >
      <div class="h-full overflow-y-auto p-4">
        <h4 class="h4 mb-4">How to setup {showHowForProvider.name}</h4>
        <p>Here's how to setup</p>
        <button
          class="btn variant-ringed mt-4"
          on:click={() => {
            showHowForProvider = null;
          }}>Ok</button
        >
      </div>
      <button
        class="absolute top-4 right-4"
        on:click={() => {
          showHowForProvider = null;
        }}><Icon src={XCircle} class="w-6 h-6" micro /></button
      >
    </div>
  {/if}
</div>
