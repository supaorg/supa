<script lang="ts">
  import { ProgressRing } from "@skeletonlabs/skeleton-svelte";
  import { CheckCircle, CircleAlert, XCircle } from "lucide-svelte/icons";
  import { onMount } from "svelte";
  import type {
    ModelProviderCloudConfig,
    ModelProviderConfig,
  } from "@core/models";
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import { validateKey } from "@core/tools/providerKeyValidators";

  let {
    id,
    onValidKey,
    onBlur = () => {},
    onClose = () => {},
    autofocus = true,
  } = $props<{
    id: string;
    onValidKey: (key: string) => void;
    onBlur?: (key: string) => void;
    onClose?: () => void;
    autofocus?: boolean;
  }>();

  let apiKey = $state("");
  let apiKeyIsValid = $state(false);
  let inputElement = $state<HTMLInputElement | null>(null);
  let timeout: any;
  let checkingKey = $state(false);
  let config = $state<ModelProviderConfig | null>(null);

  let showWarning = $derived(
    !checkingKey && !apiKeyIsValid && apiKey.length > 6,
  );

  function saveCloudProviderWithApiKey(apiKey: string) {
    if (!$currentSpaceStore) return false;
    
    config = {
      id: id,
      type: "cloud",
      apiKey,
    } as ModelProviderCloudConfig;

    $currentSpaceStore.saveModelProviderConfig(config);
    return true;
  }

  async function handleApiKeyChange() {
    checkingKey = true;
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      try {
        apiKeyIsValid = await validateKey(id, apiKey);
        if (apiKeyIsValid) {
          if (saveCloudProviderWithApiKey(apiKey)) {
            onValidKey(apiKey);
            onClose();
          }
        }
      } finally {
        checkingKey = false;
      }
    }, 500);
  }

  function handleBlur() {
    onBlur(apiKey);
  }

  onMount(() => {
    if (autofocus && inputElement) {
      inputElement.focus();
    }
  });
</script>

<div
  class="relative"
  class:input-success={apiKeyIsValid}
  class:input-warning={showWarning}
>
  <input
    class="input w-full"
    type="password"
    bind:value={apiKey}
    bind:this={inputElement}
    oninput={handleApiKeyChange}
    onblur={handleBlur}
  />
  {#if apiKeyIsValid}
    <span class="absolute right-8"
      ><CheckCircle size={18} class="w-6 mt-2 ml-2 mr-2" /></span
    >
  {:else if checkingKey}
    <span class="absolute right-8"><ProgressRing value={null} /></span>
  {:else if showWarning}
    <span class="absolute right-8"
      ><CircleAlert size={18} class="w-6 mt-2 ml-2 mr-2" /></span
    >
  {/if}
  <button
    class="absolute right-2 top-1/2 -translate-y-1/2"
    onclick={onClose}
  >
    <XCircle size={18} />
  </button>
</div>
