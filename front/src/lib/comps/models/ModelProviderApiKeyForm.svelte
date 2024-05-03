<script lang="ts">
  import { ProgressRadial } from "@skeletonlabs/skeleton";
  import { CheckCircle, Icon } from "svelte-hero-icons";
  import { onMount } from "svelte";
  import { client } from "$lib/tools/client";

  export let id: string;
  export let onValidKey: () => void;

  let apiKey = "";
  let apiKeyIsValid = false;
  let inputElement: HTMLInputElement;

  let timeout: any;
  let checkingKey = false;
  let controller = new AbortController();

  async function handleApiKeyChange() {
    checkingKey = true;
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      apiKeyIsValid = false;
      controller.abort();
      controller = new AbortController();
      apiKeyIsValid = await client
        .post("validate-key/" + id, apiKey)
        .then((res) => res.data as boolean);
      if (apiKeyIsValid) {
        onValidKey();
      }
      checkingKey = false;
    }, 500);
  }

  onMount(() => {
    if (inputElement) {
      inputElement.focus();
    }
  });
</script>

<div
  class="input-group variant-form-material grid-cols-[1fr_auto]"
  class:input-success={apiKeyIsValid}
>
  <input
    type="password"
    bind:value={apiKey}
    bind:this={inputElement}
    on:input={handleApiKeyChange}
  />
  {#if apiKeyIsValid}
    <span><Icon src={CheckCircle} solid class="w-6 ml-2 mr-2" /></span>
  {/if}
  {#if checkingKey}
    <span><ProgressRadial class="w-6 m-2" /></span>
  {/if}
</div>
