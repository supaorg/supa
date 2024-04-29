<script lang="ts">
  import { agentStore } from "$lib/stores/agentStore";

  function deleteAgent(id: string) {
    
  }
</script>

<div class="mx-auto max-w-3xl px-4 py-4">
  <h2 class="h2 pb-4">Agents</h2>
  <div class="flex flex-wrap gap-4">
    <table class="table table-hover">
      <tbody>
        {#each $agentStore as agent (agent.id)}
          <tr>
            <td>icon</td>
            <td><strong>{agent.name}</strong><br/>{agent.description}</td>
            <td>true</td>
            <td
              ><button on:click={() => deleteAgent(agent.id)}>Delete</button
              ></td
            >
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
