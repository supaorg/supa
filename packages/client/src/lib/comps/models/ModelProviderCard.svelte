<script lang="ts">
  import type { ModelProvider } from "@core/models";
  import ModelProviderApiKeyForm from "./ModelProviderApiKeyForm.svelte";
  import { onMount } from "svelte";
  import { ProgressRing } from "@skeletonlabs/skeleton-svelte";
  import ModelProviderOllamaConnector from "./ModelProviderOllamaConnector.svelte";
  import { currentSpaceStore } from "$lib/spaces/spaceStore";

  type State =
    | "loading"
    | "disconnected"
    | "invalid-key"
    | "connecting"
    | "connected";
    
  let state = $state<State>("disconnected");

  let {
    provider,
    onConnect = () => {},
    onDisconnect = () => {},
    onHow = () => {},
  }: {
    provider: ModelProvider;
    onConnect?: (provider: ModelProvider) => void;
    onDisconnect?: (provider: ModelProvider) => void;
    onHow?: (provider: ModelProvider) => void;
  } = $props();

  onMount(async () => {
    await checkProvider();
  });

  async function checkProvider() {
    state = "loading";

    const status = await $currentSpaceStore?.getModelProviderStatus(
      provider.id,
    );

    if (status === "valid") {
      state = "connected";
      onConnect(provider);
    } else if (status === "invalid") {
      state = "invalid-key";
    } else {
      state = "disconnected";
      onDisconnect(provider);
    }
  }

  function disconnect() {
    state = "disconnected";
    onDisconnect(provider);
    $currentSpaceStore?.deleteModelProviderConfig(provider.id);
  }
</script>

<div
  class="card p-4 flex gap-4"
  class:border-token={state === "connected" || state === "invalid-key"}
  class:border-error-100-800-token={state === "invalid-key"}
>
  <a
    href={provider.url}
    target="_blank"
    class="w-16 h-16 bg-white flex flex-shrink-0 items-center justify-center rounded"
  >
    <img class="w-5/6" src={provider.logoUrl} alt={provider.name} />
  </a>
  <div class="flex flex-col flex-grow space-y-4">
    <span
      ><a href={provider.url} target="_blank" class="font-semibold"
        >{provider.name}</a
      >{#if state === "connected"}<span
          class="ml-4 badge preset-filled-primary-500">Connected</span
        >{/if}
    </span>
    {#if state === "disconnected"}
      <div class="flex flex-grow gap-2">
        <button
          class="btn btn-md preset-filled-surface-500 flex-grow"
          onclick={() => (state = "connecting")}>Connect</button
        >
        <button
          class="btn btn-md preset-outlined-surface-500"
          onclick={() => onHow(provider)}>How?</button
        >
      </div>
    {:else if state === "invalid-key"}
      <button
        class="btn btn-md preset-filled-surface-500"
        onclick={() => (state = "connecting")}>Re-Connect</button
      >
    {:else if state === "connecting"}
      {#if provider.access === "cloud"}
        <ModelProviderApiKeyForm
          id={provider.id}
          onValidKey={(key) => {
            state = "connected";
            onConnect?.(provider);
          }}
          onBlur={(key) => {
            if (!key) {
              state = "disconnected";
            }
          }}
        />
      {:else if provider.name === "Ollama"}
        <ModelProviderOllamaConnector
          id={provider.id}
          onConnect={() => {
            state = "connected";
            onConnect?.(provider);
          }}
        />
      {/if}
    {:else if state === "connected"}
      <button class="btn btn-md preset-outlined-surface-500" onclick={disconnect}
        >Disconnect</button
      >
    {:else if state === "loading"}
      <div class="w-full"><ProgressRing value={null} /></div>
    {/if}
  </div>
</div>
