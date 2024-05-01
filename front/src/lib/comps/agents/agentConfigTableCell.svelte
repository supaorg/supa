<script lang="ts">
  import { agentConfigStore } from "$lib/stores/agentStore";
  import type { AgentConfig } from "@shared/models";
  import { SlideToggle } from "@skeletonlabs/skeleton";
  import { Icon, Trash } from "svelte-hero-icons";

  export let agent: AgentConfig;
  let isVisible: boolean = false;

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
    /></td
  >
  <td
    ><button on:click={() => deleteAgent(agent.id)}
      ><Icon src={Trash} micro class="w-4" /></button
    ></td
  >
</tr>
