<script module>
  import { marked } from "marked";
  import {
    blockLatexMarkedExtension,
    inlineLatexMarkedExtension,
  } from "./markdown-extensions/latexInMarkdown";

  marked.use({
    extensions: [inlineLatexMarkedExtension, blockLatexMarkedExtension],
  });
</script>

<script lang="ts">
  import { type TokensList, Lexer } from "marked";
  import MarkdownTokens from "./MarkdownTokens.svelte";

  let { source }: { source: string } = $props();

  let tokens = $derived.by(() => {
    const lexer = new Lexer();
    return lexer.lex(source);
  });
</script>

<div class="markdown">
  <MarkdownTokens {tokens} />
</div>
