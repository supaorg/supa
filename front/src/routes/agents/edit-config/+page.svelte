<script lang="ts">
  import { page } from "$app/stores";
  import AgentConfigEditing from "$lib/comps/agents/agentConfigEditing.svelte";

  let configId: string | null = null;

  page.subscribe((val) => {
    const configIdInParams = val.url.searchParams.get("id");
    if (configIdInParams) {
      configId = configIdInParams;
    }
  });
</script>

{#if configId}
  <AgentConfigEditing {configId} />
{/if}
