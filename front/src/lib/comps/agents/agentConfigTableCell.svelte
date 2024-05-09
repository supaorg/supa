<script lang="ts">
  import { agentConfigStore } from "$lib/stores/agentStore";
  import { client } from "$lib/tools/client";
  import type { AgentConfig } from "@shared/models";
  import { SlideToggle, getModalStore, type ModalSettings } from "@skeletonlabs/skeleton";
  import { Icon, Trash } from "svelte-hero-icons";

  export let agent: AgentConfig;
  let isVisible: boolean = isAgentVisible();
  const isDefault = agent.id === "default";
  const modalStore = getModalStore();

  function isAgentVisible() {
    return agent.meta ? agent.meta.visible !== "false" : true;
  }

  function setAgentVisibility(visible: boolean) {
    agent.meta = agent.meta || {};
    agent.meta.visible = visible ? "true" : "false";

    client.post("agent-configs/" + agent.id, agent).then((response) => {});
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
    client.delete("agent-configs/" + agent.id).then((response) => {
      agentConfigStore.update((agents) => {
        return agents.filter((a) => a.id !== agent.id);
      });
    });
  
  }
</script>

<tr>
  <td
    ><a href={"/agents/edit-config?id=" + agent.id} class="w-full h-full block"
      ><strong>{agent.name}</strong><br />{agent.description}</a
    ></td
  >
  <td
    ><SlideToggle
      name={"visible-" + agent.id}
      bind:checked={isVisible}
      size="sm"
      disabled={isDefault}
    /></td
  >
  <td>
    {#if !isDefault}
      <button on:click={requestDeleteAgent}
        ><Icon src={Trash} micro class="w-4" /></button
      >
    {:else}
      <Icon src={Trash} micro class="w-4 opacity-30" />
    {/if}
  </td>
</tr>
