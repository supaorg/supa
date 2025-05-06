<script lang="ts">
  import { ProgressRing } from "@skeletonlabs/skeleton-svelte";
  import { CheckCircle, CircleAlert, XCircle } from "lucide-svelte/icons";
  import { onMount } from "svelte";
  import { timeout } from "@core/tools/timeout";
  import type {
    ModelProviderCloudConfig,
    ModelProviderConfig,
  } from "@core/models";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
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
  let cancelTimeout: (() => void) | null = null;
  let checkingKey = $state(false);
  let config = $state<ModelProviderConfig | null>(null);

  let showWarning = $derived(
    !checkingKey && !apiKeyIsValid && apiKey.length > 6,
  );

  function saveCloudProviderWithApiKey(apiKey: string) {
    if (!spaceStore.currentSpace) return false;
    
    config = {
      id: id,
      type: "cloud",
      apiKey,
    } as ModelProviderCloudConfig;

    spaceStore.currentSpace?.saveModelProviderConfig(config);
    return true;
  }

  async function handleApiKeyChange() {
    checkingKey = true;
    if (cancelTimeout) cancelTimeout();
    cancelTimeout = timeout(async () => {
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
    class="input w-full pr-16 transition-all duration-200 {checkingKey ? 'focus:ring-primary-500/50 animate-[pulse_1.5s_ease-in-out_infinite]' : showWarning ? 'focus:ring-warning-500' : ''}"
    type="password"
    bind:value={apiKey}
    bind:this={inputElement}
    oninput={handleApiKeyChange}
    onblur={handleBlur}
  />
  {#if apiKeyIsValid}
    <span class="absolute right-9 top-1/2 -translate-y-1/2">
      <CheckCircle size={18} class="text-success-500" />
    </span>
  {:else if showWarning}
    <span class="absolute right-9 top-1/2 -translate-y-1/2">
      <CircleAlert size={18} class="text-warning-500" />
    </span>
  {/if}
  <button
    class="absolute right-2.5 top-1/2 -translate-y-1/2"
    onclick={onClose}
  >
    <XCircle size={18} />
  </button>
</div>
