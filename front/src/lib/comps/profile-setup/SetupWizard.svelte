<script lang="ts">
  import { ProgressRadial, Step, Stepper } from "@skeletonlabs/skeleton";
  import { client } from "$lib/tools/client";
  import { CheckCircle, Icon } from "svelte-hero-icons";
  import { profileStore } from "$lib/stores/profile";
  import type { ModelProvider, Profile } from "@shared/models";
  import ModelProviders from "../models/ModelProviders.svelte";

  let name = "";

  let connectedProviders: ModelProvider[] = [];

  function handleComplete() {
    client
      .post("setup", {
        name
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
          bind:value={name}
        />
      </form>
    </Step>
    <Step locked={connectedProviders.length === 0}>
      <svelte:fragment slot="header">Setup a model provider</svelte:fragment>
      <ModelProviders
        onConnect={onProviderConnect}
        onDisconnect={onProviderDisconnect}
      />
    </Step>
  </Stepper>
</div>
