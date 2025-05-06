<script lang="ts">
  import type { CustomProviderConfig, ModelProvider } from "@core/models";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import { onMount } from "svelte";
  import { Tooltip } from '@skeletonlabs/skeleton-svelte';
  import { CircleAlert, Edit, Trash2 } from "lucide-svelte";
  import { interval } from "@core/tools/interval";
  import CustomProviderForm from "./CustomProviderForm.svelte";
  
  type ProviderStatus = "disconnected" | "invalid-key" | "connected";
    
  let status: ProviderStatus = $state("disconnected");
  let isEditing = $state(false);
  let isConfigured = $state(false);
  let isChecking = $state(false);
  let validationError = $state<string | null>(null);
  let showValidationWarning = $derived(status === "invalid-key" as ProviderStatus);
  let confirmingDelete = $state(false);

  let {
    provider,
    onConnect = () => {},
    onDisconnect = () => {},
    onDeleted = () => {},
  }: {
    provider: ModelProvider;
    onConnect?: (provider: ModelProvider) => void;
    onDisconnect?: (provider: ModelProvider) => void;
    onDeleted?: (providerId: string) => void;
  } = $props();

  let cancelInterval: () => void;

  onMount(() => {
    checkConfigurationAndStatus();
    cancelInterval = interval(checkConfigurationAndStatus, 30000);
    return cancelInterval;
  });

  async function checkConfigurationAndStatus() {
    // Check if the provider is configured
    const config = spaceStore.currentSpace?.getModelProviderConfig(provider.id);
    isConfigured = !!config;

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
  
  function deleteProvider() {
    if (!confirmingDelete) {
      confirmingDelete = true;
      return;
    }
    
    if (spaceStore.currentSpace) {
      spaceStore.currentSpace.removeCustomProvider(provider.id);
      onDeleted(provider.id);
    }
    confirmingDelete = false;
  }
  
  function cancelDelete() {
    confirmingDelete = false;
  }
  
  function handleSave() {
    isEditing = false;
    checkConfigurationAndStatus();
  }
</script>

<div
  class="card p-4 flex gap-4"
  class:border-token={isConfigured && !showValidationWarning}
  class:border-warning-500={showValidationWarning}
>
  {#if !isEditing}
    <div
      class="w-16 h-16 bg-white flex flex-shrink-0 items-center justify-center rounded"
    >
      <img src="/providers/openai-like.png" alt={provider.name} class="w-5/6" />
    </div>
    
    <div class="flex flex-col flex-grow space-y-4">
      <div class="flex items-center gap-2">
        <span class="font-semibold">{provider.name}</span>
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
      
      <div class="text-xs opacity-70 flex flex-col gap-1">
        <div><strong>API URL:</strong> {provider.baseApiUrl}</div>
        <div><strong>Model ID:</strong> {provider.defaultModel}</div>
      </div>
      
      {#if !confirmingDelete}
        <div class="flex gap-2">
          <button 
            class="btn btn-sm preset-outlined-surface-500" 
            onclick={() => isEditing = true}
            title="Edit provider"
          >
            <Edit size={16} />
            <span>Edit</span>
          </button>
          <button 
            class="btn btn-sm preset-outlined-error-500" 
            onclick={deleteProvider}
            title="Delete provider"
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      {:else}
        <div class="flex flex-col gap-2">
          <div class="text-sm text-error-500">Are you sure you want to delete this provider?</div>
          <div class="flex gap-2">
            <button 
              class="btn btn-sm preset-filled-error-500" 
              onclick={deleteProvider}
            >
              Confirm Delete
            </button>
            <button 
              class="btn btn-sm preset-outlined-surface-500" 
              onclick={cancelDelete}
            >
              Cancel
            </button>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="w-full">
      <CustomProviderForm 
        providerId={provider.id}
        onSave={handleSave}
        onCancel={() => (isEditing = false)}
      />
    </div>
  {/if}
</div> 