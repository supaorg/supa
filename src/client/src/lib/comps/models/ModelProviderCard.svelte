<script lang="ts">
  import type { ModelProvider } from "@shared/models";
  import ModelProviderApiKeyForm from "./ModelProviderApiKeyForm.svelte";
  import { onMount } from "svelte";
  import { ProgressBar } from "@skeletonlabs/skeleton";
  import ModelProviderOllamaConnector from "./ModelProviderOllamaConnector.svelte";

  type State =
    | "loading"
    | "disconnected"
    | "invalid-key"
    | "connecting"
    | "connected";
  let state: State = "disconnected";

  export let provider: ModelProvider;
  export let onConnect: (provider: ModelProvider) => void = () => {};
  export let onDisconnect: (provider: ModelProvider) => void = () => {};
  export let onHow: (provider: ModelProvider) => void = () => {};

  onMount(async () => {
    await checkProvider();
  });

  async function checkProvider() {
    const providerConfig =
      // @TODO: implement getting provider from space
      //await $currentWorkspaceStore?.getModelProviderConfig(provider.id);
      null;
    if (providerConfig) {
      await checkIfValid();
    } else {
      state = "disconnected";
    }
  }

  async function checkIfValid() {
    state = "loading";

    const isValid =
      // @TODO: implement validating provider config
      //await $currentWorkspaceStore?.validateModelProviderConfig(provider.id);
      false;
    state = isValid ? "connected" : "invalid-key";

    if (isValid) {
      onConnect(provider);
    } else {
      onDisconnect(provider);
    }
  }

  function disconnect() {
    state = "disconnected";
    onDisconnect(provider);
    // @TODO: implement deleting provider from space
    //$currentWorkspaceStore?.deleteModelProviderConfig(provider.id);
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
    class="w-16 h-16 bg-white flex flex-shrink-0 items-center justify-center rounded-token"
  >
    <img class="w-5/6" src={provider.logoUrl} alt={provider.name} />
  </a>
  <div class="flex flex-col flex-grow space-y-4">
    <span
      ><a href={provider.url} target="_blank" class="font-semibold"
        >{provider.name}</a
      >{#if state === "connected"}<span
          class="ml-4 badge variant-filled-primary">Connected</span
        >{/if}
    </span>
    {#if state === "disconnected"}
      <div class="flex flex-grow gap-2">
        <button
          class="btn btn-md variant-filled flex-grow"
          on:click={() => (state = "connecting")}>Connect</button
        >
        <button
          class="btn btn-md variant-ringed"
          on:click={() => onHow(provider)}>How?</button
        >
      </div>
    {:else if state === "invalid-key"}
      <button
        class="btn btn-md variant-filled"
        on:click={() => (state = "connecting")}>Re-Connect</button
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
      <button class="btn btn-md variant-ringed" on:click={disconnect}
        >Disconnect</button
      >
    {:else if state === "loading"}
      <div class="w-full"><ProgressBar value={undefined} /></div>
    {/if}
  </div>
</div>
