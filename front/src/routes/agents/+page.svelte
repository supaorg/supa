<script lang="ts">
  import AgentConfigTableCell from "$lib/comps/agents/agentConfigTableCell.svelte";
  import CenteredPage from "$lib/comps/CenteredPage.svelte";
  import { agentStore } from "$lib/stores/agentStore";
</script>

<CenteredPage>
  <h2 class="h2 pb-6">Agents</h2>
  <a href="/new-agent-config" class="btn variant-ringed-primary">New Agent Configuration</a>
  <div class="flex flex-wrap gap-4">
    <table class="table table-hover">
      <tbody>
        {#each $agentStore as agent (agent.id)}
          <AgentConfigTableCell {agent} />
        {/each}
      </tbody>
    </table>
  </div>
</CenteredPage>
