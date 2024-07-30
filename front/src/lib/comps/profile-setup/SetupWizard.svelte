<script lang="ts">
  import { ProgressRadial, Step, Stepper } from "@skeletonlabs/skeleton";
  import { client } from "$lib/tools/client";
  import { CheckCircle, Icon } from "svelte-hero-icons";
  import { profileStore } from "$lib/stores/profileStore";
  import type { ModelProvider, Profile } from "@shared/models";
  import ModelProviders from "../models/ModelProviders.svelte";
  import { routes } from "@shared/routes/routes";

  let name = "";

  let connectedProviders: ModelProvider[] = [];

  function handleComplete() {
    client
      .post(routes.setup, {
        name,
      })
      .then((res) => {
        if (res.error) {
          console.error(res.error);
          return;
        }

        console.log("Profile setup complete");
        profileStore.set(res.data as Profile);
      });
  }

  function onProviderConnect(provider: ModelProvider) {
    if (!connectedProviders.find((p) => p.id === provider.id)) {
      connectedProviders = [...connectedProviders, provider];
    }
  }

  function onProviderDisconnect(provider: ModelProvider) {
    connectedProviders = connectedProviders.filter((p) => p.id !== provider.id);
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
          placeholder="Your name for the AI"
          bind:value={name}
          autofocus
        />
      </form>
    </Step>
    <Step locked={connectedProviders.length === 0}>
      <svelte:fragment slot="header">Setup a model provider</svelte:fragment>
      <p>
        We need at least one of them to power the AI. The most capable models
        are OpenAI’s GPT-4 (used by ChatGPT), Anthropic’s Claude 3.5, and Meta's
        Llama3.1 (from Groq or Ollama). You can set up several providers and
        later choose which model to use.
      </p>
      <div class="relative">
        <ModelProviders
          onConnect={onProviderConnect}
          onDisconnect={onProviderDisconnect}
        />
      </div>
    </Step>
  </Stepper>
</div>
