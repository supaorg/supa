<script lang="ts">
  import CenteredPage from "$lib/comps/CenteredPage.svelte";
  import AgentConfigTableCell from "$lib/comps/agents/AgentConfigTableCell.svelte";
  import { agentConfigStore } from "$lib/stores/agentStore";
  import { txtStore } from "$lib/stores/txtStore";
</script>

<CenteredPage>
  <h2 class="h2 pb-6">{$txtStore.agentsPage.title}</h2>
  <div class="card p-4 space-y-4 mb-4">
    <h3 class="h3">Chats</h3>
    <table class="table-auto w-full">
      <tbody>
        {#each $agentConfigStore as agent (agent.id)}
          <AgentConfigTableCell {agent} />
        {/each}
      </tbody>
    </table>

    <a href="/apps/new-config" class="btn mt-2 variant-ringed-primary"
      >{$txtStore.agentsPage.buttonNewConfig}</a
    >
  </div>
  <div class="card p-4">An ability to create other types of apps is coming soon.</div>
</CenteredPage>
