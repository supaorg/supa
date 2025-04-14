<script lang="ts">
  let { children } = $props();

  import "../app.css";
  import Entry from "$lib/comps/Entry.svelte";
</script>

<svelte:head>
  <title>Supa</title>
  <meta name="description" content="Supa" />
</svelte:head>

<Entry>
  {@render children?.()}
</Entry>