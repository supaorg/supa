<script module>
  import { createHighlighterCoreSync } from "shiki/core";
  import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
  import { Copy, Plus } from "lucide-svelte";
  //import { bundledLanguages } from "shiki/langs";

  // Theme
  import themeDarkPlus from "shiki/themes/dark-plus.mjs";

  // Languages
  //import console from "shiki/langs/console.mjs";
  import html from "shiki/langs/html.mjs";
  import css from "shiki/langs/css.mjs";
  import js from "shiki/langs/javascript.mjs";
  import ts from "shiki/langs/typescript.mjs";
  import json from "shiki/langs/json.mjs";
  import md from "shiki/langs/markdown.mjs";
  import python from "shiki/langs/python.mjs";
  import bash from "shiki/langs/bash.mjs";
  import sql from "shiki/langs/sql.mjs";

  const shiki = createHighlighterCoreSync({
    engine: createJavaScriptRegexEngine(),
    themes: [themeDarkPlus],
    langs: [html, css, js, ts, json, md, python, bash, sql],
  });
</script>

<script lang="ts">
  import type { Tokens } from "marked";

  let { token }: { token: Tokens.Code } = $props();
  let lang = $derived(token.lang || "plaintext");
  let isCopied = $state(false);
  let generatedHtml = $derived.by(() => { 
    try {
      return shiki.codeToHtml(token.text, {
        lang,
        theme: themeDarkPlus,
      });
    } catch (e) {
      // If the language is not supported, fallback to plaintext
      try {
        return shiki.codeToHtml(token.text, {
          lang: "plaintext",
          theme: themeDarkPlus,
        });
      } catch (e) {
        return null;
      }
    }
  });

  async function copyCode() {
    await navigator.clipboard.writeText(token.text);
    isCopied = true;
    setTimeout(() => {
      isCopied = false;
    }, 2000);
  }
</script>

<div class="relative">
  <div class="flex items-center py-2 text-xs justify-between h-9">
    <span>{lang}</span>
    <button 
      class="flex gap-1 items-center btn btn-sm" 
      onclick={copyCode}
      aria-label="Copy">
      {#if isCopied}
        <Plus size={14} />
        Copied
      {:else}
        <Copy size={14} />
        Copy
      {/if}
    </button>
  </div>
  <div class="">
    {#if generatedHtml}
      {@html generatedHtml}
    {:else}
      <pre><code>{token.text}</code></pre>
    {/if}
  </div>
</div>
