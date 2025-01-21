<script lang="ts">
import type { Tokens } from 'marked'
import type { Snippet } from "svelte";

let { token, children } = $props<{
  token: Tokens.Heading,
  children: Snippet
}>();
</script>

<svelte:element this={`h${token.depth}`}>
  {@render children()}
</svelte:element>
