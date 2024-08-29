<script lang="ts">
  import { appConfigStore } from "$lib/stores/appConfigStore";
  import { client } from "$lib/tools/client";
  import type { AppConfig } from "@shared/models";
  import { apiRoutes } from "@shared/apiRoutes";
  import {
    SlideToggle,
    getModalStore,
    type ModalSettings,
  } from "@skeletonlabs/skeleton";
  import { Icon, Trash } from "svelte-hero-icons";
  import { getCurrentWorkspaceId } from "$lib/stores/workspaceStore";

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

    client
      .post(apiRoutes.appConfig(getCurrentWorkspaceId(), config.id), config)
      .then((response) => {});
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
    client
      .delete(apiRoutes.appConfig(getCurrentWorkspaceId(), config.id))
      .then((response) => {
        appConfigStore.update((appConfigs) => {
          return appConfigs.filter((a) => a.id !== config.id);
        });
      });
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
