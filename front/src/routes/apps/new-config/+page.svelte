<script>
  import CenteredPage from "$lib/comps/CenteredPage.svelte";
  import AgentConfigEditing from "$lib/comps/agents/AgentConfigEditing.svelte";
</script>

<CenteredPage>
  <ol class="breadcrumb mb-4">
    <li class="crumb">
      <a class="anchor" href="/apps">Apps</a>
    </li>
    <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
    <li>New Config</li>
  </ol>
  <AgentConfigEditing />
</CenteredPage>
