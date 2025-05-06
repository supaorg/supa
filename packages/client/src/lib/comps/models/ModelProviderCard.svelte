<script lang="ts">
  import type { ModelProvider, ModelProviderLocalConfig } from "@core/models";
  import ModelProviderApiKeyForm from "./ModelProviderApiKeyForm.svelte";
  import ModelProviderOllamaAddressForm from "./ModelProviderOllamaAddressForm.svelte";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import { onMount } from "svelte";
  import { checkOllamaStatus } from "./ollama";
  import { Tooltip } from '@skeletonlabs/skeleton-svelte';
  import { CircleAlert } from "lucide-svelte/icons";
  import { interval } from "@core/tools/interval";

  type ProviderStatus =
    | "disconnected"
    | "invalid-key"
    | "connected";
    
  let status: ProviderStatus = $state("disconnected");
  let isEditing = $state(false);
  let isConfigured = $state(false);
  let isChecking = $state(false);
  let validationError = $state<string | null>(null);
  let showValidationWarning = $derived(status === "invalid-key" as ProviderStatus);

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

  let cancelInterval: () => void;

  onMount(() => {
    checkConfigurationAndStatus();
    cancelInterval = interval(checkConfigurationAndStatus, 30000);
    return cancelInterval;
  });

  async function checkConfigurationAndStatus() {
    // First check if the provider is configured
    const config = spaceStore.currentSpace?.getModelProviderConfig(provider.id) as ModelProviderLocalConfig | undefined;
    isConfigured = !!config;

    // For Ollama, check if it's running
    if (provider.name === "Ollama") {
      isChecking = true;
      try {
        const isRunning = await checkOllamaStatus(config);
        if (isRunning) {
          status = "connected";
          onConnect(provider);
        } else {
          status = "disconnected";
          onDisconnect(provider);
        }
      } catch (e) {
        status = "disconnected";
        onDisconnect(provider);
      } finally {
        isChecking = false;
      }
      return;
    }

    // For other providers
    if (!isConfigured) {
      status = "disconnected";
      return;
    }

    // For cloud providers, check their status
    isChecking = true;
    try {
      const providerStatus = await spaceStore.currentSpace?.getModelProviderStatus(
        provider.id,
      );

      if (providerStatus === "valid") {
        status = "connected";
        onConnect(provider);
      } else if (providerStatus === "invalid") {
        status = "invalid-key";
        validationError = "API key validation failed. The key might be invalid or expired.";
        onDisconnect(provider);
      } else {
        status = "disconnected";
        validationError = "Connection failed. Please check your network.";
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
    isConfigured = false;
    validationError = null;
    onDisconnect(provider);
    spaceStore.currentSpace?.deleteModelProviderConfig(provider.id);
  }
</script>

<div
  class="card p-4 flex gap-4"
  class:border-token={isConfigured && !showValidationWarning}
  class:border-warning-500={showValidationWarning}
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
      {#if isConfigured}
        <div class="flex items-center gap-1">
          <span class="badge {showValidationWarning ? 'preset-filled-warning-500' : 'preset-filled-success-500'} {isChecking ? 'animate-pulse' : ''}">Connected</span>
          {#if showValidationWarning}
            <Tooltip 
              positioning={{ placement: 'top' }}
              triggerBase="underline"
              contentBase="card preset-filled p-4"
              openDelay={200}
            >
              {#snippet trigger()}
                <CircleAlert size={14} class="text-warning-500" />
              {/snippet}
              {#snippet content()}
                <div class="text-sm max-w-[200px]">
                  {validationError || 'Validation failed. Check your API key or connection.'}
                </div>
              {/snippet}
            </Tooltip>
          {/if}
        </div>
      {/if}
    </div>

    {#if !isEditing}
      <div class="flex flex-grow gap-2">
        {#if isConfigured}
          {#if provider.access !== "local"}
            <button 
              class="btn btn-md preset-outlined-surface-500" 
              onclick={disconnect}
            >
              Disconnect
            </button>
          {/if}
        {:else if provider.access === "local"}
          <button
            class="btn btn-md preset-outlined-surface-500 flex-grow"
            onclick={() => (isEditing = true)}
          >
            Configure
          </button>
          <button
            class="btn btn-md preset-outlined-surface-500"
            onclick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onHow(provider);
            }}
          >
            How?
          </button>
        {:else}
          <button
            class="btn btn-md preset-filled-primary-500 flex-grow"
            onclick={() => (isEditing = true)}
          >
            Connect
          </button>
          <button
            class="btn btn-md preset-outlined-surface-500"
            onclick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onHow(provider);
            }}
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
            isConfigured = true;
            status = "connected";
            onConnect(provider);
          }}
          onBlur={(key) => {
            if (!key) {
              isEditing = false;
            }
          }}
          onClose={() => {
            isEditing = false;
          }}
        />
      {:else if provider.name === "Ollama"}
        <ModelProviderOllamaAddressForm
          id={provider.id}
          onValidAddress={(address) => {
            isEditing = false;
            checkConfigurationAndStatus();
          }}
          onBlur={(address) => {
            if (!address) {
              isEditing = false;
            }
          }}
          onClose={() => {
            isEditing = false;
          }}
        />
      {/if}
    {/if}
  </div>
</div>
