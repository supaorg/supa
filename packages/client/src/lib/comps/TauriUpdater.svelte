<script lang="ts">
  import { check, Update } from "@tauri-apps/plugin-updater";
  import { relaunch } from "@tauri-apps/plugin-process";
  import { onMount } from "svelte";

  let tauriUpdate: Update | null = $state(null);

  async function checkForTauriUpdate() {
    tauriUpdate = await check();

    if (tauriUpdate) {
      await tauriUpdate.downloadAndInstall();

      // @TODO: put it in a popover
      //await relaunch();
    }
  }

  onMount(() => {
    checkForTauriUpdate();
  });
</script>
