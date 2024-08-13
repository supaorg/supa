<script lang="ts">
  import type {
    ModelProvider,
    ModelProviderCloudConfig,
    ModelProviderLocalConfig,
    ModelProviderConfig,
  } from "@shared/models";

  import { client } from "$lib/tools/client";
  import { apiRoutes } from "@shared/apiRoutes";
  import { onMount } from "svelte";

  export let id: string;
  export let onConnect = () => {};
  
  let isNotOnline = false;

  async function saveLocalProvider() {
    const config = {
      id: id,
      type: "local",
    } as ModelProviderLocalConfig;

    await client.post(apiRoutes.providerConfigs, config);
  }

  async function checkIfOnline() {
    try {
      const res = await fetch("http://localhost:11434/api/tags");
      if (res.status !== 200) {
        isNotOnline = true;
      } else {
        saveLocalProvider();
        onConnect();
      }
    } catch (e) {
      isNotOnline = true;
      // Let's check again in 250ms
      setTimeout(() => {
        checkIfOnline();
      }, 250);
    }
  }

  onMount(() => {
    checkIfOnline();
  });
</script>

{#if isNotOnline}
  <div>Ollama is not running yet. Make sure you start it and it runs at http://localhost:11434/</div>
{:else}
  <div>Connecting...</div>
{/if}
