<script lang="ts">
  import { ProgressRing } from "@skeletonlabs/skeleton-svelte";
  import { CheckCircle, CircleAlert } from "lucide-svelte/icons";
  import { onMount } from "svelte";
  import type {
    ModelProviderCloudConfig,
    ModelProviderConfig,
  } from "@shared/models";
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import { validateKey } from "@shared/tools/providerKeyValidators";

  export let id: string;
  export let onValidKey: (key: string) => void;
  export let onBlur: (key: string) => void = () => {};
  export let autofocus = true;

  let apiKey = "";
  let apiKeyIsValid = false;
  let inputElement: HTMLInputElement;
  let timeout: any;
  let checkingKey = false;

  let config: ModelProviderConfig | null;

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
      let apiKeyIsValid = await validateKey(id, apiKey);
      if (apiKeyIsValid) {
        saveCloudProviderWithApiKey(apiKey);
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

  let showWarning = false;

  $: showWarning = !checkingKey && !apiKeyIsValid && apiKey.length > 6;
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
