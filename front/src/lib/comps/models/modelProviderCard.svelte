<script lang="ts">
  import type { ModelProvider } from "@shared/models";
  import ModelProviderApiKeyForm from "./ModelProviderApiKeyForm.svelte";
  import { onMount } from "svelte";
  import { client } from "$lib/tools/client";

  type State = "disconnected" | "connecting" | "connected";
  let state: State = "disconnected";

  export let provider: ModelProvider;

  onMount(async () => {
    if (provider.access === "cloud") {
      const key = await client
        .get("secrets/key_" + provider.id)
        .then((res) => res.data as string);

      if (key) {
        const apiKeyIsValid = await client
          .post("validate-key/" + provider.id, key)
          .then((res) => res.data as boolean);

        state = apiKeyIsValid ? "connected" : "disconnected";
      }
    }
  });
</script>

<div class="card p-4 flex gap-4" class:border-token={state === "connected"}>
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
      >{#if state === "connected"}<span class="ml-4 badge variant-filled-primary"
          >Connected</span
        >{/if}
    </span>
    {#if state === "disconnected"}
      <button
        class="btn btn-md variant-filled"
        on:click={() => (state = "connecting")}>Connect</button
      >
    {:else if state === "connecting"}
      {#if provider.access === "cloud"}
        <ModelProviderApiKeyForm
          id={provider.id}
          onValidKey={() => (state = "connected")}
        />
      {/if}
    {:else if state === "connected"}
      <button
        class="btn btn-md variant-ringed"
        on:click={() => (state = "disconnected")}>Disconnect</button
      >
    {/if}
  </div>
</div>
