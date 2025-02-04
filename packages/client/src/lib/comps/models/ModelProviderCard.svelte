<script lang="ts">
  import type { ModelProvider } from "@core/models";
  import ModelProviderApiKeyForm from "./ModelProviderApiKeyForm.svelte";
  import { onMount } from "svelte";
  import { ProgressRing } from "@skeletonlabs/skeleton-svelte";
  import ModelProviderOllamaConnector from "./ModelProviderOllamaConnector.svelte";
  import { currentSpaceStore } from "$lib/spaces/spaceStore";

  type ProviderStatus =
    | "disconnected"
    | "invalid-key"
    | "connected";
    
  let status: ProviderStatus = $state("disconnected");
  let isEditing = $state(false);
  let isConfigured = $state(false);
  let isChecking = $state(false);

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

  let checkInterval: number;

  onMount(() => {
    checkConfigurationAndStatus();
    // Check provider status every 30 seconds
    checkInterval = setInterval(checkConfigurationAndStatus, 30000);
    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  });

  async function checkConfigurationAndStatus() {
    // First check if the provider is configured
    const config = $currentSpaceStore?.getModelProviderConfig(provider.id);
    isConfigured = !!config;

    if (!isConfigured) {
      status = "disconnected";
      return;
    }

    isChecking = true;
    try {
      const providerStatus = await $currentSpaceStore?.getModelProviderStatus(
        provider.id,
      );

      if (providerStatus === "valid") {
        status = "connected";
        onConnect(provider);
      } else if (providerStatus === "invalid") {
        status = "invalid-key";
        onDisconnect(provider);
      } else {
        status = "disconnected";
        onDisconnect(provider);
      }
    } catch (error) {
      status = "disconnected";
      onDisconnect(provider);
    } finally {
      isChecking = false;
    }
  }

  function disconnect() {
    status = "disconnected";
    onDisconnect(provider);
    $currentSpaceStore?.deleteModelProviderConfig(provider.id);
  }
</script>

<div
  class="card p-4 flex gap-4"
  class:border-token={status === "connected"}
  class:border-error-100-800-token={status === "invalid-key"}
>
  <a
    href={provider.url}
    target="_blank"
    class="w-16 h-16 bg-white flex flex-shrink-0 items-center justify-center rounded"
  >
    <img class="w-5/6" src={provider.logoUrl} alt={provider.name} />
  </a>
  <div class="flex flex-col flex-grow space-y-4">
    <div class="flex items-center gap-2">
      <a href={provider.url} target="_blank" class="font-semibold">{provider.name}</a>
      {#if status === "connected"}
        <span class="badge preset-filled-primary-500">Connected</span>
      {:else if status === "invalid-key"}
        <span class="badge preset-filled-error-500">Invalid Key</span>
      {/if}
    </div>

    {#if !isEditing}
      <div class="flex flex-grow gap-2">
        {#if status === "connected" && provider.access !== "local"}
          <button 
            class="btn btn-md preset-outlined-surface-500" 
            disabled={isChecking}
            onclick={disconnect}
          >
            Disconnect
          </button>
        {:else if status !== "connected"}
          <button
            class="btn btn-md preset-filled-surface-500 flex-grow"
            disabled={isChecking}
            onclick={() => (isEditing = true)}
          >
            Connect
          </button>
          <button
            class="btn btn-md preset-outlined-surface-500"
            onclick={() => onHow(provider)}
          >
            How?
          </button>
        {/if}
      </div>
    {:else}
      {#if provider.access === "cloud"}
        <ModelProviderApiKeyForm
          id={provider.id}
          onValidKey={(key) => {
            isEditing = false;
            status = "connected";
            onConnect(provider);
          }}
          onBlur={(key) => {
            if (!key) {
              isEditing = false;
            }
          }}
        />
      {:else if provider.name === "Ollama"}
        <ModelProviderOllamaConnector
          id={provider.id}
          onConnect={() => {
            isEditing = false;
            checkConfigurationAndStatus();
          }}
        />
      {/if}
    {/if}
  </div>
</div>
