<script lang="ts">
  import type { Tokens } from "marked";

  export let token: Tokens.Link;

  let language: string | undefined;
  let code: string;
</script>
<a class="anchor" target="_blank" href={token.href} title={token.title}>{token.text}</a>


