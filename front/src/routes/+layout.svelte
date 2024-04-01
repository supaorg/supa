<script lang="ts">
  import "../app.postcss";
  import AppWrap from "$lib/comps/AppWrap.svelte";

</script>

<svelte:head>
  <title>Supamind</title>
  <meta
    name="description"
    content="Supamind"
  />
</svelte:head>

<AppWrap>
  <slot />
</AppWrap>
