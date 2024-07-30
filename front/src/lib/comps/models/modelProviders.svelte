<script lang="ts">
  import type { ModelProvider } from "@shared/models";
  import ModelProviderCard from "./ModelProviderCard.svelte";
  import { onMount } from "svelte";
  import { client } from "$lib/tools/client";
  import { routes } from "@shared/routes/routes";

  let providers: ModelProvider[] = [];

  export let onConnect: (provider: ModelProvider) => void = () => {};
  export let onDisconnect: (provider: ModelProvider) => void = () => {};

  function onHow(provider: ModelProvider) {
    console.log("HOW?");
  }

  onMount(async () => {
    providers = await client
      .get(routes.providers)
      .then((res) => res.data as ModelProvider[]);
  });
</script>

<div class="grid grid-cols-2 gap-4">
  {#each providers as provider (provider.id)}
    <ModelProviderCard {provider} {onConnect} {onDisconnect} {onHow} />
  {/each}
</div>
