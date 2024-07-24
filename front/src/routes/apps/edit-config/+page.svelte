<script lang="ts">
  import { page } from "$app/stores";
  import CenteredPage from "$lib/comps/CenteredPage.svelte";
  import AgentConfigEditing from "$lib/comps/agents/AgentConfigEditing.svelte";

  let configId: string | null = null;

  page.subscribe((val) => {
    const configIdInParams = val.url.searchParams.get("id");
    if (configIdInParams) {
      configId = configIdInParams;
    }
  });
</script>

<CenteredPage>
  {#if configId}
    <AgentConfigEditing {configId} />
  {/if}
</CenteredPage>
