<script lang="ts">
  import { page } from "$app/stores";
  import CenteredPage from "$lib/comps/basic/CenteredPage.svelte";
  import AppConfigEditing from "$lib/comps/app-configs/AppConfigEditing.svelte";

  let configId: string | null = null;

  $: configId = $page.url.searchParams.get("id");
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
    <AppConfigEditing {configId} />
  {/if}
</CenteredPage>
