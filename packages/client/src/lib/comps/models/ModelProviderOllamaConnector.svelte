<script lang="ts">
  import type { ModelProviderLocalConfig } from "@core/models";
  import { onMount } from "svelte";
  import { currentSpaceStore } from "$lib/spaces/spaceStore";

  let { id, onConnect = () => {} } = $props<{
    id: string;
    onConnect?: () => void;
  }>();

  let isNotOnline = $state(false);
  let isConnecting = $state(true);

  async function saveLocalProvider() {
    const config = {
      id: id,
      type: "local",
    } as ModelProviderLocalConfig;

    if ($currentSpaceStore) {
      await $currentSpaceStore.saveModelProviderConfig(config);
      onConnect();
    }
  }

  async function checkIfOnline() {
    isConnecting = true;
    try {
      const res = await fetch("http://localhost:11434/api/tags");
      if (res.status !== 200) {
        isNotOnline = true;
      } else {
        isNotOnline = false;
        await saveLocalProvider();
      }
    } catch (e) {
      isNotOnline = true;
      // Let's check again in 250ms
      setTimeout(() => {
        checkIfOnline();
      }, 250);
    } finally {
      isConnecting = false;
    }
  }

  onMount(() => {
    checkIfOnline();
  });
</script>

{#if isNotOnline}
  <div class="text-error-500">
    Ollama is not running yet. Make sure you start it and it runs at
    http://localhost:11434/
  </div>
{:else if isConnecting}
  <div>Connecting to Ollama...</div>
{:else}
  <div class="text-success-500">Connected to Ollama</div>
{/if}
