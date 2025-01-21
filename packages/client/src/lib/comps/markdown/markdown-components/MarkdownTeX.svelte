<script lang="ts">
  import katex from 'katex';
  import type { Tokens } from "marked";

  interface TexToken extends Tokens.Codespan {
    displayMode?: boolean;
  }

  let { token }: { token: TexToken } = $props();
  let output: HTMLElement;

  $effect(() => {
    if (output && token.text) {
      katex.render(token.text, output, { 
        displayMode: token.displayMode ?? false,
        throwOnError: false
      });
    }
  });
</script>

<span bind:this={output}></span>
