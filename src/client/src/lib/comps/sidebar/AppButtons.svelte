<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import type { AppConfig } from "@shared/models";
  import Pen from "lucide-svelte/icons/pen";
  import { onMount } from "svelte";

  function newAppTree() {
    if (!$currentSpaceStore) return;

    $currentSpaceStore.newAppTree("default-chat");
  }

  let appConfigs: AppConfig[] = [];

  onMount(() => {
    appConfigs = $currentSpaceStore?.getAppConfigs() || [];
  });
</script>

<button class="sidebar-btn w-full flex" on:click={newAppTree}>
  <span class="w-6 h-6 flex-shrink-0">
    <span class="relative flex h-full items-center justify-center">
      <Pen size={18} />
    </span>
  </span>
  <span class="flex-grow text-left">Ask AI</span>
</button>
