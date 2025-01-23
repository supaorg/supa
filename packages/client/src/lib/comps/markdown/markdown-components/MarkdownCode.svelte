<script module>
  import { codeToHtml } from "shiki";
  import { Copy, Plus } from "lucide-svelte";
</script>

<script lang="ts">
  import type { Tokens } from "marked";

  let { token }: { token: Tokens.Code } = $props();
  let lang = $derived(token.lang || "text");
  let isCopied = $state(false);
  let generatedHtml = $derived.by(async () => {
    return await generatedHighlightedHtml(token.text, token.lang);
  });

  async function generatedHighlightedHtml(
    source: string,
    lang?: string,
  ): Promise<string | null> {
    const theme = "github-dark";

    try {
      return await codeToHtml(source, {
        lang: lang || "text",
        theme,
      });
    } catch (e) {
      // If the language is not supported, fallback to plaintext
      try {
        return await codeToHtml(source, {
          lang: "text",
          theme,
        });
      } catch (e) {
        return null;
      }
    }
  }

  async function copyCode() {
    await navigator.clipboard.writeText(token.text);
    isCopied = true;
    setTimeout(() => {
      isCopied = false;
    }, 2000);
  }
</script>

<div class="relative group" class:has-lang={lang !== "text"}>
  {#if lang !== "text"}
    <div class="absolute left-4 top-3 z-10 flex items-center">
      <span class="text-xs opacity-70 flex items-center">{lang}</span>
    </div>
  {/if}
  <div class="absolute right-4 top-3 z-10 flex items-center">
    <button
      class="flex gap-1 items-center text-xs opacity-70 hover:opacity-100"
      onclick={copyCode}
      aria-label="Copy"
    >
      {#if isCopied}
        <Plus size={14} />
        Copied
      {:else}
        <Copy size={14} />
      {/if}
    </button>
  </div>
  {#await generatedHtml}
    <pre><code>{token.text}</code></pre>
  {:then html}
    {#if html}
      {@html html}
    {:else}
      <pre><code>{token.text}</code></pre>
    {/if}
  {:catch error}
    Error: {error}
  {/await}
</div>

<style>
  .has-lang :global(pre) {
    padding-top: 2.5rem !important;
  }
</style>
