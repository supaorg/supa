<script lang="ts">
  import CenteredPage from "$lib/comps/CenteredPage.svelte";
  import AgentConfigTableCell from "$lib/comps/agents/agentConfigTableCell.svelte";
  import { agentConfigStore } from "$lib/stores/agentStore";
    import { txtStore } from "$lib/stores/txtStore";
</script>

<CenteredPage>
  <h2 class="h2 pb-6">{$txtStore.agentsPage.title}</h2>
  <a href="/agents/new-config" class="btn variant-ringed-primary"
    >{$txtStore.agentsPage.buttonNewConfig}</a
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
