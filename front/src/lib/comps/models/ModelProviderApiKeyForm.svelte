<script lang="ts">
  import { ProgressRadial } from "@skeletonlabs/skeleton";
  import { CheckCircle, ExclamationCircle, Icon } from "svelte-hero-icons";
  import { onMount } from "svelte";
  import { client } from "$lib/tools/client";

  export let id: string;
  export let onValidKey: () => void;

  let apiKey = "";
  let apiKeyIsValid = false;
  let inputElement: HTMLInputElement;

  let timeout: any;
  let checkingKey = false;
  //let controller = new AbortController();

  async function handleApiKeyChange() {
    checkingKey = true;
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      apiKeyIsValid = false;
      //controller.abort();
      //controller = new AbortController();
      console.log("Checking key", apiKey);
      console.log("validate-key/" + id);
      apiKeyIsValid = await client
        .post("validate-key/" + id, apiKey)
        .then((res) => res.data as boolean);
      if (apiKeyIsValid) {
        onValidKey();

        client.post("secrets/key_" + id, apiKey).then((res) => {
          console.log("Key saved", res);
        });
      }
      checkingKey = false;
    }, 500);
  }

  onMount(() => {
    if (inputElement) {
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
    type="password"
    bind:value={apiKey}
    bind:this={inputElement}
    on:input={handleApiKeyChange}
  />
  {#if apiKeyIsValid}
    <span class="absolute right-0"><Icon src={CheckCircle} solid class="w-6 mt-2 ml-2 mr-2" /></span>
  {:else if checkingKey}
    <span class="absolute right-0"><ProgressRadial class="w-6 m-2" /></span>
  {:else if showWarning}
  <span class="absolute right-0"><Icon src={ExclamationCircle} solid class="w-6 mt-2 ml-2 mr-2" /></span>
  {/if}
</div>
