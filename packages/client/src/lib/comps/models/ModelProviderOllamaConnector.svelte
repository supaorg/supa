<script lang="ts">
  import type { ModelProviderLocalConfig } from "@core/models";
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import ModelProviderOllamaAddressForm from "./ModelProviderOllamaAddressForm.svelte";

  let { id, onConnect = () => {} } = $props<{
    id: string;
    onConnect?: () => void;
  }>();

  let isNotOnline = $state(false);
  let isConnecting = $state(true);
  let isEditing = $state(false);

  async function checkIfOnline(address = "http://localhost:11434") {
    isConnecting = true;
    try {
      const res = await fetch(`${address}/api/tags`);
      if (res.status !== 200) {
        isNotOnline = true;
        onConnect(false);
      } else {
        isNotOnline = false;
        onConnect(true);
      }
    } catch (e) {
      isNotOnline = true;
      onConnect(false);
      // Let's check again in 250ms if using default address
      if (address === "http://localhost:11434") {
        setTimeout(() => {
          checkIfOnline();
        }, 250);
      }
    } finally {
      isConnecting = false;
    }
  }

  $effect(() => {
    const config = $currentSpaceStore?.getModelProviderConfig(id);
    if (config?.type === "local" && config.apiUrl) {
      checkIfOnline(config.apiUrl);
    } else {
      checkIfOnline();
    }
  });
</script>

{#if isEditing}
  <ModelProviderOllamaAddressForm
    {id}
    onValidAddress={(address) => {
      isEditing = false;
      checkIfOnline(address);
    }}
    onBlur={(address) => {
      if (!address) {
        isEditing = false;
      }
    }}
  />
{:else}
  {#if isConnecting}
    <div>Checking if Ollama is running...</div>
  {:else if isNotOnline}
    <div class="flex flex-col gap-2">
      <div class="alert variant-filled-error">
        <span>Ollama is not running</span>
      </div>
      <button
        class="btn btn-md preset-filled-surface-500 flex-grow"
        onclick={() => isEditing = true}
      >
        Configure Custom Address
      </button>
    </div>
  {:else}
    <div class="text-success-500">Connected to Ollama</div>
  {/if}
{/if}
