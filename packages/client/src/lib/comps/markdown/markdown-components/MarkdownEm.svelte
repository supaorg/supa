<script lang="ts">
  import type { Snippet } from "svelte";
  let { children } = $props<{ children: Snippet }>();
</script>

<em>
  {@render children()}
</em>
