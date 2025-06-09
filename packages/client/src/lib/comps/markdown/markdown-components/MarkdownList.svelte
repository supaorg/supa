<script lang="ts">
  import MarkdownToken from "../MarkdownToken.svelte";
  import type { Tokens } from "marked";

  let { token }: { token: Tokens.List } = $props();

  let component = $derived(token.ordered ? "ol" as const : "ul" as const);
</script>

<svelte:element this={component} start={token.start || 1}>
  {#each token.items as item}
    <MarkdownToken token={{ ...item }} />
  {/each}
</svelte:element>
