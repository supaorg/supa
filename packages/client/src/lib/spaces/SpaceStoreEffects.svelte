<script lang="ts">
  import { spaceStore } from "./spaces.svelte";
  import { initializeDatabase, savePointers, saveCurrentSpaceId, saveConfig } from "../localDb";
  import { onMount } from "svelte";
  
  // Add callback prop for space loading status
  let { onSpaceLoad } = $props<{ onSpaceLoad?: (hasSpaces: boolean) => void }>()
  
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
      
      await spaceStore.loadSpacesAndConnectToCurrent();
      
      initialized = true;
      
      // Call the onSpaceLoad callback if provided
      if (onSpaceLoad) {
        console.log("SpaceStoreEffects: onSpaceLoad", spaceStore.currentSpaceConnection);
        onSpaceLoad(spaceStore.currentSpaceConnection !== null);
      }
    } catch (error) {
      console.error('Failed to initialize space state from database:', error);
    }
  });
  
  // Effects for persisting state changes
  $effect(() => {
    if (initialized) {
      savePointers(spaceStore.pointers);
    }
  });

  $effect(() => {
    if (initialized && spaceStore.currentSpaceId !== null) {
      saveCurrentSpaceId(spaceStore.currentSpaceId);
    }
  });

  $effect(() => {
    if (initialized) {
      saveConfig(spaceStore.config);
    }
  });
</script>
