<script>
  import CenteredPage from "$lib/comps/basic/CenteredPage.svelte";
  import AppConfigEditing from "$lib/comps/app-configs/AppConfigEditing.svelte";
</script>

<CenteredPage>
  <ol class="breadcrumb mb-4">
    <li class="crumb">
      <a class="anchor" href="/apps">Apps</a>
    </li>
    <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
    <li>New Config</li>
  </ol>
  <AppConfigEditing />
</CenteredPage>
