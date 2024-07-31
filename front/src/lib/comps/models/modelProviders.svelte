<script lang="ts">
  import type { ModelProvider } from "@shared/models";
  import ModelProviderCard from "./ModelProviderCard.svelte";
  import { onMount } from "svelte";
  import { client } from "$lib/tools/client";
  import { routes } from "@shared/routes/routes";
  import { Icon, XCircle } from "svelte-hero-icons";

  let providers: ModelProvider[] = [];

  let showHowForProvider: ModelProvider | null = null;

  export let onConnect: (provider: ModelProvider) => void = () => {};
  export let onDisconnect: (provider: ModelProvider) => void = () => {};

  function onHow(provider: ModelProvider) {
    showHowForProvider = provider;
  }

  onMount(async () => {
    providers = await client
      .get(routes.providers)
      .then((res) => res.data as ModelProvider[]);
  });
</script>

<div class="relative">
  <div class="grid grid-cols-2 gap-4">
    {#each providers as provider (provider.id)}
      <ModelProviderCard {provider} {onConnect} {onDisconnect} {onHow} />
    {/each}
  </div>
  {#if showHowForProvider}
    <div
      class="absolute card shadow-lg w-full h-full top-0 left-0 overflow-hidden"
    >
      <div class="h-full overflow-y-auto p-4 space-y-4">
        <h4 class="h4 mb-4">How to setup {showHowForProvider.name}</h4>
        {#if showHowForProvider.name === "OpenAI"}
          <p>
            You will need to enter a key that will allow you to use OpenAI's
            models.
          </p>
          <ol class="list">
            <li>
              <span>1.</span>
              <span class="flex-auto"
                >Sign up or login for in OpenAI: <a
                  class="anchor"
                  href="https://platform.openai.com/"
                  >https://platform.openai.com</a
                ></span
              >
            </li>
            <li>
              <span>2.</span>
              <span class="flex-auto"
                >Add credits to your balance here <a
                  class="anchor"
                  href="https://platform.openai.com/settings/organization/billing/overview"
                  >https://platform.openai.com/settings/organization/billing/overview</a
                ></span
              >
            </li>
            <li>
              <span>3.</span>
              <span class="flex-auto"
                >Go to <a
                  class="anchor"
                  href="https://platform.openai.com/api-keys"
                  >https://platform.openai.com/api-keys</a
                > and create a new secret key.</span
              >
            </li>
            <li>
              <span>4.</span>
              <span class="flex-auto"
                >Paste the key in the input field and click "Connect".</span
              >
            </li>
          </ol>
        {:else if showHowForProvider.name === "Anthropic"}
          <p>
            You will need to enter a key that will allow you to use Anthropic's
            models.
          </p>
          <ol class="list">
            <li>
              <span>1.</span>
              <span class="flex-auto">Sign up or login for in Anthropic: <a
          class="anchor"
          href="https://console.anthropic.com/"
          >https://console.anthropic.com/</a
              ></span>
            </li>
            <li>
              <span>2.</span>
              <span class="flex-auto">Go to <a
          class="anchor"
          href="https://console.anthropic.com/settings/keys"
          >https://console.anthropic.com/settings/keys</a
              > and create a new key.</span>
            </li>
            <li>
              <span>3.</span>
              <span class="flex-auto">Paste the key in the input field and click "Connect".</span>
            </li>
          </ol>
        {:else if showHowForProvider.name === "Groq"}
          <p>
            You will need to enter a key that will allow you to use Groq's
            models.
          </p>
          <ol class="list">
            <li>
              <span>1.</span>
              <span class="flex-auto">Sign up or login for in Groq: <a
          class="anchor"
          href="https://console.groq.com/">https://console.groq.com/</a
              ></span>
            </li>
            <li>
              <span>2.</span>
              <span class="flex-auto">Go to <a class="anchor" href="https://console.groq.com/keys"
          >https://console.groq.com/keys</a
              ></span>
            </li>
            <li>
              <span>3.</span>
              <span class="flex-auto">Paste the key in the input field and click "Connect".</span>
            </li>
          </ol>
        {:else}
          <p>
            You will need to install and run Ollama to use its models. You can
            run it locally and then point to the address it's running.
          </p>
          <ol class="list">
            <li>
              <span>1.</span>
              <span class="flex-auto">Download Ollama from <a class="anchor" href="https://ollama.com/"
          >https://ollama.com/</a></span>
            </li>
            <li>
              <span>2.</span>
              <span class="flex-auto">Install Ollama and setup a model you would like to use.</span>
            </li>
          </ol>
        {/if}
        <button
          class="btn variant-ringed mt-4"
          on:click={() => {
            showHowForProvider = null;
          }}>Ok</button
        >
      </div>
      <button
        class="absolute top-4 right-4"
        on:click={() => {
          showHowForProvider = null;
        }}><Icon src={XCircle} class="w-6 h-6" micro /></button
      >
    </div>
  {/if}
</div>
