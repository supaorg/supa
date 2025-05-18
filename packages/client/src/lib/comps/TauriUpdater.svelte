<script lang="ts">
  import { check, Update } from "@tauri-apps/plugin-updater";
  import { relaunch } from "@tauri-apps/plugin-process";
  import { onMount } from "svelte";
  import { Download, X, RefreshCw } from "lucide-svelte";

  let tauriUpdate: Update | null = $state(null);
  let showToast = $state(true);

  async function checkForTauriUpdate() {
    console.log("Checking for update...");
    tauriUpdate = await check();
    console.log("tauriUpdate", tauriUpdate);
    if (tauriUpdate) {
      await tauriUpdate.downloadAndInstall();
      showToast = true;
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

{#if showToast}
  <div
    class="fixed top-4 right-4 bg-surface-50 dark:bg-surface-900 rounded-lg shadow-lg border border-surface-200 dark:border-surface-700 p-4 z-50 w-80 transition-all duration-200"
    role="alert"
  >
    <div class="flex items-start gap-3">
      <div class="flex-shrink-0 mt-0.5">
        <div class="h-5 w-5 text-primary-500">
          <Download size={20} />
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex justify-between items-start">
          <h3 class="text-sm font-semibold text-surface-900 dark:text-white">
            Update Ready
          </h3>
          <button
            onclick={handleClose}
            class="text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <p class="mt-1 text-sm text-surface-600 dark:text-surface-400">
          Version <span class="font-medium text-surface-900 dark:text-white"
            >{tauriUpdate && tauriUpdate.version}</span
          > is ready to install.
        </p>
        <div class="mt-3 flex gap-2">
          <button
            type="button"
            onclick={handleClose}
            class="btn variant-ghost-sm"
          >
            Later
          </button>
          <button
            type="button"
            onclick={handleRelaunch}
            class="btn variant-filled-primary-sm flex items-center gap-1.5"
          >
            <RefreshCw size={14} />
            Relaunch Now
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
