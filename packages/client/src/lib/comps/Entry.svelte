<script lang="ts">
  import { onMount } from "svelte";
  import Loading from "$lib/comps/basic/Loading.svelte";
  import TauriWindowSetup from "$lib/comps/tauri/TauriWindowSetup.svelte";
  import { isTauri } from "$lib/tauri/isTauri";
  import { spaceStore } from "$lib/spaces/spaces.svelte";
  import SpaceStoreEffects from "$lib/spaces/SpaceStoreEffects.svelte";
  import SpaceSetup from "$lib/comps/spaces/SpaceSetup.svelte";
  import type { SpaceConnection } from "$lib/spaces/LocalSpaceSync";

  type Status = "initializing" | "needsSpace" | "ready";

  let { children } = $props();
  let status: Status = $state("initializing");
  let currentConnection: SpaceConnection | null = $state(null);

  onMount(() => {
    console.log("Mounting Entry");

    const initializeApp = async () => {
      if (!isTauri()) {
        throw new Error(
          "We don't support regular browsers yet. We have to run this from Tauri",
        );
      }
      
      // Wait for initialization to complete (handled by SpaceStoreEffects)
      const checkInitialization = () => {
        if (spaceStore.initialized) {
          // SpaceStoreEffects has completed initialization
          currentConnection = spaceStore.currentSpaceConnection;
          
          if (currentConnection) {
            status = "ready";
          } else {
            status = "needsSpace";
          }
        } else {
          // Check again in a bit
          setTimeout(checkInitialization, 100);
        }
      };
      
      checkInitialization();
    };

    initializeApp();

    return () => {
      if (currentConnection && currentConnection.connected) {
        currentConnection.disconnect();
      }
    };
  });

  async function onSpaceSetup(spaceId: string) {
    // TODO: implement connecting
    console.error("Not implemented yet");
    status = "ready";
  }
</script>

<!-- Always include SpaceStoreEffects for database operations -->
<SpaceStoreEffects />

{#if status === "initializing"}
  <Loading />
{:else if status === "needsSpace"}
  <SpaceSetup {onSpaceSetup} />
{:else if status === "ready"}
  {@render children?.()}
{/if}

{#if isTauri()}
  <TauriWindowSetup />
{/if}
