<script lang="ts">
  import type { ModelProvider, ModelProviderCloudConfig, ModelProviderConfig } from "@shared/models";
  import ModelProviderApiKeyForm from "./ModelProviderApiKeyForm.svelte";
  import { onMount } from "svelte";
  import { client } from "$lib/tools/client";
  import { ProgressBar } from "@skeletonlabs/skeleton";

  type State =
    | "loading"
    | "disconnected"
    | "invalid-key"
    | "connecting"
    | "connected";
  let state: State = "disconnected";

  export let provider: ModelProvider;

  let config: ModelProviderConfig | null;

  onMount(async () => {
    await checkProvider();
  });

  async function checkProvider() {
    const res = await client.get("provider-configs/" + provider.id);

    if (res.data) {
      config = res.data as ModelProviderConfig;
      await checkIfValid();
    } else {
      state = "disconnected";
    }
  }

  async function saveCloudProviderWithApiKey(apiKey: string) {
    config = {
      id: provider.id,
      type: "cloud",
      apiKey,
    } as ModelProviderCloudConfig;

    await client.post("provider-configs", config);
  }

  async function checkIfValid() {
    state = "loading";

    const isValid = await client
      .post(`provider-configs/${provider.id}/validate`)
      .then((res) => res.data as boolean);

    state = isValid ? "connected" : "invalid-key";
  }

  function disconnect() {
    state = "disconnected";

    if (provider.access === "cloud") {
      client.delete("provider-configs/" + provider.id);
    }
  }
</script>

<div
  class="card p-4 flex gap-4"
  class:border-token={state === "connected" || state === "invalid-key"}
  class:border-error-100-800-token={state === "invalid-key"}
>
  <a
    href={provider.url}
    target="_blank"
    class="w-16 h-16 bg-white flex items-center justify-center rounded-token"
  >
    <img class="w-5/6" src={provider.logoUrl} alt={provider.name} />
  </a>
  <div class="flex flex-col space-y-4">
    <span
      ><a href={provider.url} target="_blank" class="font-semibold"
        >{provider.name}</a
      >{#if state === "connected"}<span
          class="ml-4 badge variant-filled-primary">Connected</span
        >{/if}
    </span>
    {#if state === "disconnected"}
      <button
        class="btn btn-md variant-filled"
        on:click={() => (state = "connecting")}>Connect</button
      >
    {:else if state === "invalid-key"}
      <button
        class="btn btn-md variant-filled"
        on:click={() => (state = "connecting")}>Re-Connect</button
      >
    {:else if state === "connecting"}
      {#if provider.access === "cloud"}
        <ModelProviderApiKeyForm
          id={provider.id}
          onValidKey={(key) => {
            state = "connected";
            saveCloudProviderWithApiKey(key);
          }}
        />
      {/if}
    {:else if state === "connected"}
      <button class="btn btn-md variant-ringed" on:click={disconnect}
        >Disconnect</button
      >
    {:else if state === "loading"}
      <div class="w-full"><ProgressBar value={undefined} /></div>
    {/if}
  </div>
</div>
