<script lang="ts">
import type { Token } from 'marked';
import MarkdownToken from './MarkdownToken.svelte';

let { tokens } : { tokens: Token[] | null } = $props();
</script>

{#if tokens}
  {#each tokens as token}
    <MarkdownToken {token} />
  {/each}
{/if}
