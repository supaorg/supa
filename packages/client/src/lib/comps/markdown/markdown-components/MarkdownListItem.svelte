<script lang="ts">
  import type { Tokens } from "marked";
  import type { Snippet } from "svelte";

  let { children, token }: { children: Snippet; token: Tokens.ListItem } =
    $props();
</script>

<li>{@render children()}</li>