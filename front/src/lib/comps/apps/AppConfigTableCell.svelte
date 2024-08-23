<script lang="ts">
  import { agentConfigStore } from "$lib/stores/agentStore";
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

  export let agent: AppConfig;
  let isVisible: boolean = isAgentVisible();
  const isDefault = agent.id === "default";
  const modalStore = getModalStore();

  function isAgentVisible() {
    return agent.meta ? agent.meta.visible !== "false" : true;
  }

  function setAgentVisibility(visible: boolean) {
    agent.meta = agent.meta || {};
    agent.meta.visible = visible ? "true" : "false";

    client.post(apiRoutes.appConfig(getCurrentWorkspaceId(), agent.id), agent).then((response) => {});
  }

  $: {
    if (isVisible !== isAgentVisible()) {
      setAgentVisibility(isVisible);
    }
  }

  const deletionModal = {
    type: "confirm",
    title: `Delete the ${agent.name} agent?`,
    body: "Are you sure you want to delete this agent?",
    response: (r: boolean) => {
      if (r) {
        deleteAgent();
      }
    },
  } as ModalSettings;

  function requestDeleteAgent() {
    modalStore.trigger(deletionModal);
  }

  function deleteAgent() {
    client.delete(apiRoutes.appConfig(getCurrentWorkspaceId(), agent.id)).then((response) => {
      agentConfigStore.update((agents) => {
        return agents.filter((a) => a.id !== agent.id);
      });
    });
  }
</script>

<tr class="table-row">
  <td class="py-2"
    ><a href={"/apps/edit-config?id=" + agent.id} class="w-full h-full block"
      ><strong>{agent.name}</strong><br />{agent.description}</a
    ></td
  >
  <td
    ><SlideToggle
      name={"visible-" + agent.id}
      bind:checked={isVisible}
      size="sm"
    /></td
  >
  <td>
    {#if !isDefault}
      <button on:click={requestDeleteAgent}
        ><Icon src={Trash} micro class="w-4" /></button
      >
    {:else}
      <div><Icon src={Trash} micro class="w-4 opacity-30" /></div>
    {/if}
  </td>
</tr>
