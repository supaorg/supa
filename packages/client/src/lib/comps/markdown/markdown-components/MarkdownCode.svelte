<script module>
  import { codeToHtml } from "shiki";
  import { Copy, Plus } from "lucide-svelte";
</script>

<script lang="ts">
  import type { Tokens } from "marked";

  let { token }: { token: Tokens.Code } = $props();
  let lang = $derived(token.lang || "plaintext");
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

<div class="relative">
  <div class="flex items-center py-2 text-xs justify-between h-9 opacity-70">
    <span>{lang}</span>
    <button
      class="flex gap-1 items-center"
      onclick={copyCode}
      aria-label="Copy"
    >
      {#if isCopied}
        <Plus size={14} />
        Copied
      {:else}
        <Copy size={14} />
        Copy
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
