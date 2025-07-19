<script lang="ts">
  import { onMount } from "svelte";
  import { SupaApp, type ClientStateConfig } from "@supa/client";

  let config: ClientStateConfig | null = $state(null);

  onMount(() => {
    if (typeof process !== "undefined" && process.versions) {
      const info = {
        node: process.versions.node || "N/A",
        chrome: process.versions.chrome || "N/A",
        electron: process.versions.electron || "N/A",
      };

      console.log("⚛️ Electron info:", info);
    }

    config = { };
  });
</script>

<svelte:head>
  <title>Supa</title>
</svelte:head>

<SupaApp {config} />