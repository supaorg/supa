<script lang="ts">
  let { children } = $props();

  import "../app.css";
  import Entry from "$lib/comps/Entry.svelte";
  import App from "$lib/comps/apps/App.svelte";
</script>

<svelte:head>
  <title>Supa</title>
  <meta name="description" content="Supa" />
</svelte:head>

<Entry>
  <App>
    {@render children?.()}
  </App>
</Entry>