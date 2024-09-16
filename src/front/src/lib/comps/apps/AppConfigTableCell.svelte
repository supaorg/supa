<script lang="ts">
  import { currentWorkspaceStore } from "$lib/stores/workspaceStore";
  import type { AppConfig } from "@shared/models";
  import {
    SlideToggle,
    getModalStore,
    type ModalSettings,
  } from "@skeletonlabs/skeleton";
  import { Icon, Trash } from "svelte-hero-icons";

  export let config: AppConfig;
  let isVisible: boolean = isAppConfigVisible();
  const isDefault = config.id === "default";
  const modalStore = getModalStore();

  function isAppConfigVisible() {
    return config.meta ? config.meta.visible !== "false" : true;
  }

  function setAppConfigVisibility(visible: boolean) {
    config.meta = config.meta || {};
    config.meta.visible = visible ? "true" : "false";

    $currentWorkspaceStore?.updateAppConfig(config);
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
    $currentWorkspaceStore?.deleteAppConfig(config.id);
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
        ><Icon src={Trash} micro class="w-4" /></button
      >
    {:else}
      <div><Icon src={Trash} micro class="w-4 opacity-30" /></div>
    {/if}
  </td>
</tr>
