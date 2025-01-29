<script lang="ts">
  import type { ModelProviderLocalConfig } from "@core/models";
  import { onMount } from "svelte";
  import { currentSpaceStore } from "$lib/spaces/spaceStore";

  let { id, onConnect = () => {} } = $props<{
    id: string;
    onConnect?: () => void;
  }>();

  let isNotOnline = $state(false);

  async function saveLocalProvider() {
    const config = {
      id: id,
      type: "local",
    } as ModelProviderLocalConfig;

    $currentSpaceStore?.saveModelProviderConfig(config);
  }

  async function checkIfOnline() {
    try {
      const res = await fetch("http://localhost:11434/api/tags");
      if (res.status !== 200) {
        isNotOnline = true;
      } else {
        await saveLocalProvider();
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
  <div>
    Ollama is not running yet. Make sure you start it and it runs at
    http://localhost:11434/
  </div>
{:else}
  <div>Connecting...</div>
{/if}
