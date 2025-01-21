<script lang="ts">
import MarkdownTokens from './MarkdownTokens.svelte';
import { defaultRenderers } from './markedConfiguration';

let { token } = $props();

const renderers = defaultRenderers();
const MarkdownComponent = renderers[token.type];
</script>

{#if MarkdownComponent}
  <MarkdownComponent {token}>
    {#if 'tokens' in token && token['tokens']}
      <MarkdownTokens tokens={token['tokens']} />
    {:else}
      {token.raw}
    {/if}
  </MarkdownComponent>
{/if}