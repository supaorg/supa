<script lang="ts">
  import type { ModelProvider } from "@shared/models";
  import ModelProviderApiKeyForm from "./ModelProviderApiKeyForm.svelte";

  type State = 'disconnected' | 'connecting' | 'connected';
  let state: State = 'disconnected';

  export let provider: ModelProvider;
</script>

<div class="card p-4 flex gap-4" class:border-token={state === 'connected'}>
  <a
    href={provider.url}
    target="_blank"
    class="w-16 h-16 bg-white flex items-center justify-center rounded-token"
  >
    <img class="w-5/6" src={provider.logoUrl} alt={provider.name} />
  </a>
  <div class="flex flex-col space-y-4">
    <a href={provider.url} target="_blank" class="font-semibold"
      >{provider.name}</a
    >
    {#if state === "disconnected"}
      <button
        class="btn btn-md variant-filled"
        on:click={() => (state = 'connecting')}>Connect</button
      >
    {:else if state === "connecting"}
      {#if provider.access === 'cloud'}
        <ModelProviderApiKeyForm id={provider.id} onValidKey={() => (state = "connected")} />
      {/if}  
    {:else if state === 'connected'}
      <button
        class="btn btn-md variant-ringed"
        on:click={() => (state = 'disconnected')}>Disconnect</button
      >
    {/if}
  </div>
</div>
