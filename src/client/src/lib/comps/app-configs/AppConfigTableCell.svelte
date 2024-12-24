<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import type { AppConfig } from "@shared/models";
  import {
    SlideToggle,
    //getModalStore,
    type ModalSettings,
  } from "@skeletonlabs/skeleton";
  import { TrashIcon } from "lucide-svelte";

  let { config }: { config: AppConfig } = $props();

  let isVisible: boolean = $state(
    config.visible !== undefined ? config.visible : true,
  );
  const isDefault = config.id === "default";
  //const modalStore = getModalStore();

  $effect(() => {
    setAppConfigVisibility(isVisible);
  });

  function setAppConfigVisibility(visible: boolean) {
    if (visible !== config.visible) {
      console.log("setting visible", visible);
      $currentSpaceStore?.updateAppConfig(config.id, { visible });
    }

    /*
    // @TODO: just use 'config' from props
    const vertex = $currentSpaceStore?.tree.getVertex(config.id);
    if (vertex) {
      console.log("setting visible", visible);
      const isCurrentVisible = vertex.getProperty("visible")?.value === true;
      if (isCurrentVisible !== visible) {
        console.log("setting visible", visible);
        $currentSpaceStore?.tree.setVertexProperty(
          config.id,
          "visible",
          visible,
        );
      }
    }
    */
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
    //modalStore.trigger(deletionModal);
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
      <button onclick={requestDeleteAppConfig}
        ><TrashIcon class="w-4" /></button
      >
    {:else}
      <div><TrashIcon class="w-4 opacity-30" /></div>
    {/if}
  </td>
</tr>
