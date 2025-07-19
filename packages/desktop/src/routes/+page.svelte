<script lang="ts">
  import { onMount } from "svelte";
  import { SupaApp, type ClientStateConfig } from "@supa/client";
  import { electronFsWrapper } from "../electronFsWrapper";

  let config: ClientStateConfig | null = $state(null);

  onMount(() => {
    // Log Electron environment info
    if (typeof process !== "undefined" && process.versions) {
      const info = {
        node: process.versions.node || "N/A",
        chrome: process.versions.chrome || "N/A",
        electron: process.versions.electron || "N/A",
      };

      console.log("⚛️ Electron info:", info);
    }

    console.log("electronFsWrapper", electronFsWrapper);

    // Initialize config with the Electron file system implementation
    config = {
      fs: electronFsWrapper
    };
  });
</script>

<svelte:head>
  <title>Supa</title>
</svelte:head>

<SupaApp {config} />
