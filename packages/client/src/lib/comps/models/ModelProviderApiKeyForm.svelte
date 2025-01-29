<script lang="ts">
  import { ProgressRing } from "@skeletonlabs/skeleton-svelte";
  import { CheckCircle, CircleAlert } from "lucide-svelte/icons";
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
    autofocus = true,
  } = $props<{
    id: string;
    onValidKey: (key: string) => void;
    onBlur?: (key: string) => void;
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

  async function saveCloudProviderWithApiKey(apiKey: string) {
    config = {
      id: id,
      type: "cloud",
      apiKey,
    } as ModelProviderCloudConfig;

    $currentSpaceStore?.saveModelProviderConfig(config);
  }

  async function handleApiKeyChange() {
    checkingKey = true;
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      apiKeyIsValid = await validateKey(id, apiKey);
      if (apiKeyIsValid) {
        await saveCloudProviderWithApiKey(apiKey);
        onValidKey(apiKey);
      }
      checkingKey = false;
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
  class="relative input-group variant-form-material"
  class:input-success={apiKeyIsValid}
  class:input-warning={showWarning}
>
  <input
    class="w-full"
    type="password"
    bind:value={apiKey}
    bind:this={inputElement}
    oninput={handleApiKeyChange}
    onblur={handleBlur}
  />
  {#if apiKeyIsValid}
    <span class="absolute right-0"
      ><CheckCircle size={18} class="w-6 mt-2 ml-2 mr-2" /></span
    >
  {:else if checkingKey}
    <span class="absolute right-0"><ProgressRing value={null} /></span>
  {:else if showWarning}
    <span class="absolute right-0"
      ><CircleAlert size={18} class="w-6 mt-2 ml-2 mr-2" /></span
    >
  {/if}
</div>
