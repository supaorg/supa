<script lang="ts">
  import { onMount } from "svelte";
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import { providers } from "@core/providers";
  import type { ModelProviderLocalConfig } from "@core/models";

  let checkInterval: number;
  let isChecking = false;

  async function checkAndConfigureOllama() {
    if (isChecking || !$currentSpaceStore) return;
    
    isChecking = true;
    try {
      // First check if Ollama is already configured
      const ollamaProvider = providers.find(p => p.id === "ollama");
      if (!ollamaProvider) return;

      const existingConfig = $currentSpaceStore.getModelProviderConfig("ollama");
      if (existingConfig) return;

      // Check if Ollama is running
      const res = await fetch("http://localhost:11434/api/tags");
      if (res.status === 200) {
        // Ollama is running but not configured, let's add it
        const config: ModelProviderLocalConfig = {
          id: "ollama",
          type: "local"
        };
        await $currentSpaceStore.saveModelProviderConfig(config);
      }
    } catch (e) {
      // Ollama is not running, we'll check again later
    } finally {
      isChecking = false;
    }
  }

  onMount(() => {
    // Check immediately on mount
    checkAndConfigureOllama();
    
    // Check every 5 seconds - more frequent for Ollama since it's a local service
    // that users might start/stop more frequently
    checkInterval = setInterval(checkAndConfigureOllama, 5000);

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  });
</script>
