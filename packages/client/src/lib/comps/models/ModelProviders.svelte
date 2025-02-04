<script lang="ts">
  import type { ModelProvider } from "@core/models";
  import ModelProviderCard from "./ModelProviderCard.svelte";
  import { XCircle } from "lucide-svelte/icons";
  import Link from "../basic/Link.svelte";
  import ModelProviderApiKeyForm from "./ModelProviderApiKeyForm.svelte";
  import ModelProviderOllamaConnector from "./ModelProviderOllamaConnector.svelte";
  import { providers } from "@core/providers";

  let showHowForProvider: ModelProvider | null = $state(null);

  let {
    onConnect,
    onDisconnect,
  }: {
    onConnect?: (provider: ModelProvider) => void;
    onDisconnect?: (provider: ModelProvider) => void;
  } = $props();

  function onHow(provider: ModelProvider) {
    showHowForProvider = provider;
  }
</script>

<div class="relative">
  <div class="grid grid-cols-2 gap-4">
    {#each providers as provider (provider.id)}
      <ModelProviderCard {provider} {onConnect} {onDisconnect} {onHow} />
    {/each}
  </div>
  {#if showHowForProvider}
    <div
      class="absolute card preset-filled-surface-100-900 border-[1px] border-surface-200-800 shadow-lg w-full h-full top-0 left-0 overflow-hidden z-50"
    >
      <div class="h-full overflow-y-auto p-4 space-y-4">
        <h4 class="h5 mb-4">How to setup {showHowForProvider.name}</h4>
        {#if showHowForProvider.name === "OpenAI"}
          <p>
            You will need to enter a key that will allow you to use OpenAI's
            models.
          </p>
          <ol class="list">
            <li>
              <span>1.</span>
              <span class="flex-auto"
                >Sign up or login for in OpenAI: <Link
                  href="https://platform.openai.com"
                  >https://platform.openai.com</Link
                >
              </span>
            </li>
            <li>
              <span>2.</span>
              <span class="flex-auto"
                >Add credits to your balance here <Link
                  href="https://platform.openai.com/settings/organization/billing/overview"
                  >https://platform.openai.com/settings/organization/billing/overview</Link
                ></span
              >
            </li>
            <li>
              <span>3.</span>
              <span class="flex-auto"
                >Go to <Link href="https://platform.openai.com/api-keys"
                  >https://platform.openai.com/api-keys</Link
                > and create a new secret key.</span
              >
            </li>
            <li>
              <span>4.</span>
              <span class="flex-auto"
                >Paste the key here and wait for it to validate.</span
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
              <span class="flex-auto"
                >Sign up or login for in Anthropic: <Link
                  href="https://console.anthropic.com/"
                  >https://console.anthropic.com/</Link
                ></span
              >
            </li>
            <li>
              <span>2.</span>
              <span class="flex-auto"
                >Go to <Link href="https://console.anthropic.com/settings/keys"
                  >https://console.anthropic.com/settings/keys</Link
                > and create a new key.</span
              >
            </li>
            <li>
              <span>3.</span>
              <span class="flex-auto"
                >Paste the key here and wait for it to validate.</span
              >
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
              <span class="flex-auto"
                >Sign up or login for in Groq: <Link
                  href="https://console.groq.com/"
                  >https://console.groq.com/</Link
                ></span
              >
            </li>
            <li>
              <span>2.</span>
              <span class="flex-auto"
                >Go to <Link href="https://console.groq.com/keys"
                  >https://console.groq.com/keys</Link
                > and create an API key</span
              >
            </li>
            <li>
              <span>3.</span>
              <span class="flex-auto"
                >Paste the key here and wait for it to validate.</span
              >
            </li>
          </ol>
        {:else if showHowForProvider.name === "DeepSeek"}
          <p>
            You will need to enter a key that will allow you to use DeepSeek's
            models.
          </p>
          <ol class="list">
            <li>
              <span>1.</span>
              <span class="flex-auto"
                >Sign up or login for DeepSeek: <Link
                  href="https://platform.deepseek.com/"
                  >https://platform.deepseek.com/</Link
                ></span
              >
            </li>
            <li>
              <span>2.</span>
              <span class="flex-auto"
                >Go to <Link href="https://platform.deepseek.com/api"
                  >https://platform.deepseek.com/api</Link
                > and create an API key</span
              >
            </li>
            <li>
              <span>3.</span>
              <span class="flex-auto"
                >Paste the key here and wait for it to validate.</span
              >
            </li>
          </ol>
        {:else if showHowForProvider.name === "Ollama"}
          <p>
            You will need to install and run Ollama to use its models. You can
            run it locally and Supa will connect to it.
          </p>
          <ol class="list">
            <li>
              <span>1.</span>
              <span class="flex-auto"
                >Download Ollama from <Link href="https://ollama.com/"
                  >https://ollama.com/</Link
                ></span
              >
            </li>
            <li>
              <span>2.</span>
              <span class="flex-auto"
                >Install Ollama and setup a model you would like to use.</span
              >
            </li>
            <li>
              <span>3.</span>
              <span class="flex-auto">Go back here after you start it.</span
              >
            </li>
          </ol>
        {:else}
          <p>No setup instructions available for this provider.</p>
        {/if}
        {#if showHowForProvider.access === "cloud"}
          <ModelProviderApiKeyForm
            id={showHowForProvider.id}
            autofocus={false}
            onValidKey={() => {
              showHowForProvider = null;
            }}
          />
        {:else if showHowForProvider.name === "Ollama"}
          <ModelProviderOllamaConnector
            id={showHowForProvider.id}
            onConnect={() => {
              showHowForProvider = null;
            }}
          />
        {/if}
        <button
          class="btn preset-outlined-surface-500 mt-4"
          onclick={() => {
            showHowForProvider = null;
          }}>Ok</button
        >
      </div>
      <button
        class="absolute top-4 right-4"
        onclick={() => {
          showHowForProvider = null;
        }}><XCircle size={18} /></button
      >
    </div>
  {/if}
</div>
