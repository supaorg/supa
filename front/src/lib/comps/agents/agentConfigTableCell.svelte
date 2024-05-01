<script lang="ts">
  import { agentConfigStore } from "$lib/stores/agentStore";
  import { client } from "$lib/tools/client";
  import type { AgentConfig } from "@shared/models";
  import { SlideToggle } from "@skeletonlabs/skeleton";
  import { Icon, Trash } from "svelte-hero-icons";

  export let agent: AgentConfig;
  let isVisible: boolean = isAgentVisible();
  const isDefault = agent.id === "default";

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

  function deleteAgent(id: string) {}
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
      <button on:click={() => deleteAgent(agent.id)}
        ><Icon src={Trash} micro class="w-4" /></button
      >
    {:else}
      <Icon src={Trash} micro class="w-4 opacity-30" />
    {/if}
  </td>
</tr>
