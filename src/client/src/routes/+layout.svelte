<script lang="ts">
  import "../app.postcss";
  import Entry from "$lib/comps/Entry.svelte";
</script>

<svelte:head>
  <title>Supamind</title>
  <meta name="description" content="SupaCloud" />
</svelte:head>

<Entry>
  <slot />
</Entry>