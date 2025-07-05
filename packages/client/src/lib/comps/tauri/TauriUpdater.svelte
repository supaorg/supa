<script lang="ts">
  import { check, Update } from "@tauri-apps/plugin-updater";
  import { relaunch } from "@tauri-apps/plugin-process";
  import { onMount } from "svelte";
  import { Download, X, RefreshCw } from "lucide-svelte";

  let tauriUpdate: Update | null = $state(null);
  let showToast = $state(false);

  async function checkForTauriUpdate() {
    console.log("Checking for update...");
    tauriUpdate = await check();
    if (tauriUpdate) {
      console.log("Tauri Update", tauriUpdate);
      await tauriUpdate.downloadAndInstall();
      showToast = true;
    } else {
      console.log("No update available");
    }
  }

  function handleRelaunch() {
    showToast = false;
    relaunch();
  }

  function handleClose() {
    showToast = false;
  }

  onMount(() => {
    checkForTauriUpdate();
  });
</script>

{#if showToast && tauriUpdate}
  <div
    class="fixed top-4 right-4 bg-surface-50 dark:bg-surface-900 rounded-lg shadow-lg border border-surface-200 dark:border-surface-700 p-4 z-50 w-80 transition-all duration-200"
    role="alert"
  >
    <div class="flex items-start gap-3">
      <div class="flex-shrink-0 mt-0.5">
        <div class="h-5 w-5">
          <Download size={20} />
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex justify-between items-start">
          <h3 class="text-sm font-semibold">
            Update Supa
          </h3>
          <button
            onclick={handleClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <p class="mt-1 text-sm">
          We've got a new version <span class="font-medium">
            {tauriUpdate && tauriUpdate.version}
          </span>. Need to relaunch to use it.
        </p>
      </div>
    </div>
    <div class="mt-3 w-full flex gap-2">
      <button
        type="button"
        onclick={handleClose}
        class="btn btn-sm preset-outlined-surface-500 flex-1 justify-center"
      >
        Later
      </button>
      <button
        type="button"
        onclick={handleRelaunch}
        class="btn btn-sm preset-filled-primary-500 flex-1 justify-center items-center gap-1.5"
      >
        <RefreshCw size={14} class="flex-shrink-0" />
        <span>Relaunch Now</span>
      </button>
    </div>
  </div>
{/if}
