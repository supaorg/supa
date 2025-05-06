<script lang="ts">
  import { onMount } from "svelte";
  import { spaceStore } from "$lib/spaces/spaces.svelte";
  import { providers } from "@core/providers";
  import type { ModelProviderLocalConfig } from "@core/models";
  import { checkOllamaStatus } from "./ollama";
  import { interval } from "@core/tools/interval";

  let isChecking = false;

  async function checkAndConfigureOllama() {
    if (isChecking || !spaceStore.currentSpace) return;

    isChecking = true;
    try {
      // First check if Ollama is already configured
      const ollamaProvider = providers.find((p) => p.id === "ollama");
      if (!ollamaProvider) return;

      const existingConfig = spaceStore.currentSpace?.getModelProviderConfig(
        "ollama",
      ) as ModelProviderLocalConfig | undefined;
      if (existingConfig) return;

      // Default to localhost if no config exists
      const address = "http://localhost:11434";

      // Check if Ollama is running
      const isRunning = await checkOllamaStatus();
      if (isRunning) {
        // Ollama is running but not configured, let's add it
        const config: ModelProviderLocalConfig = {
          id: "ollama",
          type: "local",
          apiUrl: address,
        };
        spaceStore.currentSpace?.saveModelProviderConfig(config);
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
    return interval(checkAndConfigureOllama, 5000);
  });
</script>
