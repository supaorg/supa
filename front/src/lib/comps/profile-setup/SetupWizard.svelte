<script lang="ts">
  import { ProgressRadial, Step, Stepper } from "@skeletonlabs/skeleton";
  import { client } from "$lib/tools/client";
  import { CheckCircle, Icon } from "svelte-hero-icons";

  let name = "";
  let openai = "";
  let openaiKeyIsValid = false;

  function handleComplete() {
    client
      .post("setup", {
        name,
        openai,
      })
      .then((res) => {
        console.log(res);
      });
  }

  let timeout;
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

  async function handleOpenaiKeyChange() {
    checkingKey = true;
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      openaiKeyIsValid = false;
      openaiKeyIsValid = await validateKey(openai);
      checkingKey = false;
    }, 500);
  }
</script>

<div class="card p-4 max-w-3xl mx-auto mt-4">
  <Stepper on:complete={handleComplete}>
    <Step locked={!name}>
      <svelte:fragment slot="header">What's your name?</svelte:fragment>
      <form class="space-y-2">
        <input
          class="input variant-form-material"
          type="text"
          id="name"
          bind:value={name}
        />
      </form>
    </Step>
    <!--
    <Step>
      <svelte:fragment slot="header">System Prompt</svelte:fragment>
      <form class="space-y-2">
        <textarea
          id="system-prompt"
          rows="5"
          class="textarea variant-form-material"
          placeholder=""
          bind:value={systemPrompt}
        ></textarea>
      </form>
    </Step>
    -->
    <Step locked={!openaiKeyIsValid}>
      <svelte:fragment slot="header">OpenAI Key</svelte:fragment>
      <form class="space-y-2">
        <div
          class="input-group variant-form-material grid-cols-[1fr_auto]"
          class:input-success={openaiKeyIsValid}
        >
          <input
            type="password"
            id="key-openai"
            bind:value={openai}
            on:input={handleOpenaiKeyChange}
          />
          {#if openaiKeyIsValid}
            <span><Icon src={CheckCircle} solid class="w-6 ml-2 mr-2" /></span>
          {/if}
          {#if checkingKey}
            <span><ProgressRadial class="w-6 m-2" /></span>
          {/if}
        </div>
      </form>
    </Step>
  </Stepper>
</div>
