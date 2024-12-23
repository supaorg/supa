<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import type { AppConfig } from "@shared/models";
  import Pen from "lucide-svelte/icons/pen";
  import { onMount } from "svelte";
  import { getModalStore } from "@skeletonlabs/skeleton";


  const modalStore = getModalStore();

  function openNewThreadModal(appConfigId: string) {
    modalStore.trigger({
      type: "component",
      component: "newThread",
      meta: {
        appConfigId: appConfigId,
      },
    });
  }

  /*
  function newAppTree(configId: string) {
    if (!$currentSpaceStore) return;

    const newTree = $currentSpaceStore.newAppTree("default-chat");
    newTree.tree.setVertexProperty(newTree.tree.rootVertexId, "configId", configId);
  }
  */

  let appConfigs: AppConfig[] = $state([]);

  onMount(() => {
    appConfigs = $currentSpaceStore?.getAppConfigs() || [];
  });
</script>

{#each appConfigs as config (config.id)}
  <button class="sidebar-btn w-full flex" onclick={() => openNewThreadModal(config.id)}>
    <span class="w-6 h-6 flex-shrink-0">
      <span class="relative flex h-full items-center justify-center">
        <Pen size={18} />
      </span>
    </span>
    <span class="flex-grow text-left">{config.name}</span>
  </button>
{/each}
