<script lang="ts">
  import type { Tokens } from "marked";
  export let token: Tokens.Link;
</script>
<a class="anchor" target="_blank" href={token.href} title={token.title}>{token.text}</a>