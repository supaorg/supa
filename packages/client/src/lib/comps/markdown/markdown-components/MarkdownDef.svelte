<script lang="ts">
  import type { Snippet } from "svelte";
  let { children } = $props<{children: Snippet}>();
</script>

<dfn>
  {@render children()}
</dfn>
