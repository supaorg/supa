<script lang="ts">
  import { page } from "$app/stores";
  import CenteredPage from "$lib/comps/CenteredPage.svelte";
  import AgentConfigEditing from "$lib/comps/apps/AppConfigEditing.svelte";

  let configId: string | null = null;

  page.subscribe((val) => {
    const configIdInParams = val.url.searchParams.get("id");
    if (configIdInParams) {
      configId = configIdInParams;
    }
  });
</script>

<CenteredPage>
  <ol class="breadcrumb mb-4">
    <li class="crumb">
      <a class="anchor" href="/apps">Apps</a>
    </li>
    <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
    <li>Editing Config</li>
  </ol>
  {#if configId}
    <AgentConfigEditing {configId} />
  {/if}
</CenteredPage>
