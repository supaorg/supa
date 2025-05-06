<script>
  import { spaceStore } from "./spaces.svelte";
  import { initializeDatabase, savePointers, saveCurrentSpaceId, saveConfig } from "../localDb";
  import { onMount } from "svelte";
  
  // Initialize data from database on mount
  let initialized = $state(false);
  
  onMount(async () => {
    try {
      // Initialize data from database
      const { pointers, currentSpaceId, config } = await initializeDatabase();
      
      // Set initial state to the spaceStore
      spaceStore.setInitialState({
        pointers,
        currentSpaceId,
        config
      });
      
      // Connect to spaces
      const pointer = await spaceStore.loadSpacesAndConnectToCurrent();

      console.log("Pointer", pointer);
      
      // Mark as initialized
      spaceStore.initialized = true;
      initialized = true;
    } catch (error) {
      console.error('Failed to initialize space state from database:', error);
    }
  });
  
  // Effects for persisting state changes
  $effect(() => {
    if (initialized && spaceStore.initialized) {
      savePointers(spaceStore.pointers);
    }
  });

  $effect(() => {
    if (initialized && spaceStore.initialized && spaceStore.currentSpaceId !== null) {
      saveCurrentSpaceId(spaceStore.currentSpaceId);
    }
  });

  $effect(() => {
    if (initialized && spaceStore.initialized) {
      saveConfig(spaceStore.config);
    }
  });
</script>
