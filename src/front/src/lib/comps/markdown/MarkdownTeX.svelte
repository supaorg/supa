<script lang="ts">
  import Katex from 'svelte-katex';
  import type { Tokens } from "marked";
  export let token: Tokens.Codespan;
</script>

<Katex>{token.text}</Katex>