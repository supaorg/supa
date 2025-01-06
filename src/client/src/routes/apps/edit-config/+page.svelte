<script lang="ts">
  import { page } from "$app/stores";
  import CenteredPage from "$lib/comps/basic/CenteredPage.svelte";
  import AppConfigEditing from "$lib/comps/app-configs/AppConfigEditing.svelte";

  let configId: string | null = null;

  $: configId = $page.url.searchParams.get("id");
</script>

<CenteredPage>
  <ol class="flex items-center gap-4 mb-4">
    <li><a class="opacity-60 hover:underline" href="/apps">Apps</a></li>
    <li class="opacity-50" aria-hidden="true">&rsaquo;</li>
    <li>Editing Config</li>
  </ol>
  {#if configId}
    <AppConfigEditing {configId} />
  {/if}
</CenteredPage>
