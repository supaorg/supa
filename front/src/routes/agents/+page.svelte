<script lang="ts">
  import CenteredPage from "$lib/comps/CenteredPage.svelte";
  import AgentConfigTableCell from "$lib/comps/agents/agentConfigTableCell.svelte";
  import { agentConfigStore } from "$lib/stores/agentStore";
</script>

<CenteredPage>
  <h2 class="h2 pb-6">Agents</h2>
  <a href="/agents/new-config" class="btn variant-ringed-primary"
    >New Agent Configuration</a
  >
  <div class="flex flex-wrap gap-4">
    <table class="table table-hover">
      <tbody>
        {#each $agentConfigStore as agent (agent.id)}
          <AgentConfigTableCell {agent} />
        {/each}
      </tbody>
    </table>
  </div>
</CenteredPage>
