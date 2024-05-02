<script lang="ts">
  import { ProgressRadial, Step, Stepper } from "@skeletonlabs/skeleton";
  import { client } from "$lib/tools/client";
  import { CheckCircle, Icon } from "svelte-hero-icons";
  import { profileStore } from "$lib/stores/profile";
  import type { Profile } from "@shared/models";
  import { onMount } from "svelte";

  let name = "";
  let apiKey = "";
  let apiKeyIsValid = false;
  let inputElement;

  let timeout: any;
  let checkingKey = false;
  let controller = new AbortController();
  let signal = controller.signal;

  async function validateKey(key: string): Promise<boolean> {
    controller.abort(); // abort previous request
    controller = new AbortController(); // create new controller
    signal = controller.signal;

    try {
      const res = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${key}`,
        },
        signal,
      });

      return res.ok;
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Fetch aborted");
      } else {
        console.error("Fetch error:", err);
      }

      return false;
    }
  }

  async function handleApiKeyChange() {
    checkingKey = true;
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      apiKeyIsValid = false;
      apiKeyIsValid = await validateKey(apiKey);
      checkingKey = false;
    }, 500);
  }

  onMount(() => {
    if (inputElement) {
      console.log("focus");
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
