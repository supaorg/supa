<script lang="ts">
  import { Step, Stepper } from "@skeletonlabs/skeleton";
  import { client } from "$lib/tools/client";

  let name = "";
  let systemPrompt = "";
  let openAIKey = "";

  function handleComplete() {
    console.log("Setup complete");

    client
      .post("setup", {
        name,
        systemPrompt,
        openAIKey,
      })
      .then((res) => {
        console.log(res);
      });
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
    <Step>
      <svelte:fragment slot="header">OpenAI Key</svelte:fragment>
      <form class="space-y-2">
        <input
          class="input variant-form-material"
          type="text"
          id="openai-key"
          bind:value={openAIKey}
        />
      </form>
    </Step>
  </Stepper>
</div>
