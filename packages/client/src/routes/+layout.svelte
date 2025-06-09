<script lang="ts">
  let { children } = $props();

  import "../app.css";
  import Entry from "$lib/comps/Entry.svelte";
</script>

<svelte:head>
  <title>t69</title>
  <meta name="description" content="t69" />
</svelte:head>

<Entry>
  {@render children?.()}
</Entry>