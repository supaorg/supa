<script lang="ts">
  import type { Tokens } from "marked";

  let { token } = $props<{
    token: Tokens.Image;
  }>();
</script>

<img
  src={token.href}
  title={token.title}
  alt={token.text}
  class="markdown-image"
/>

<style>
  .markdown-image {
    max-width: 100%;
  }
</style>
