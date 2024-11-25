<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import type { AppConfig } from "@shared/models";
  import {
    SlideToggle,
    getModalStore,
    type ModalSettings,
  } from "@skeletonlabs/skeleton";
  import { TrashIcon } from "lucide-svelte";

  export let config: AppConfig;
  let isVisible: boolean = isAppConfigVisible();
  const isDefault = config.id === "default";
  const modalStore = getModalStore();

  function isAppConfigVisible() {
    return config.meta ? config.meta.visible !== "false" : true;
  }

  function setAppConfigVisibility(visible: boolean) {
    $currentSpaceStore?.tree.setVertexProperty(config.id, 'visible', visible);
  }

  $: {
    if (isVisible !== isAppConfigVisible()) {
      setAppConfigVisibility(isVisible);
    }
  }

  const deletionModal = {
    type: "confirm",
    title: `Delete the ${config.name} app config?`,
    body: "Are you sure you want to delete this app config?",
    response: (r: boolean) => {
      if (r) {
        deleteAppConfig();
      }
    },
  } as ModalSettings;

  function requestDeleteAppConfig() {
    modalStore.trigger(deletionModal);
  }

  function deleteAppConfig() {
    $currentSpaceStore?.deleteVertex(config.id);
  }
</script>

<tr class="table-row">
  <td class="py-2"
    ><a href={"/apps/edit-config?id=" + config.id} class="w-full h-full block"
      ><strong>{config.name}</strong><br />{config.description}</a
    ></td
  >
  <td
    ><SlideToggle
      name={"visible-" + config.id}
      bind:checked={isVisible}
      size="sm"
    /></td
  >
  <td>
    {#if !isDefault}
      <button on:click={requestDeleteAppConfig}
        ><TrashIcon class="w-4" /></button
      >
    {:else}
      <div><TrashIcon class="w-4 opacity-30" /></div>
    {/if}
  </td>
</tr>
