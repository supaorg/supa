<script module>
  import MarkdownBloquote from "./markdown-components/MarkdownBloquote.svelte";
  import MarkdownHeading from "./markdown-components/MarkdownHeading.svelte";
  import MarkdownList from "./markdown-components/MarkdownList.svelte";
  import MarkdownListItem from "./markdown-components/MarkdownListItem.svelte";
  import MarkdownBr from "./markdown-components/MarkdownBr.svelte";
  import MarkdownCode from "./markdown-components/MarkdownCode.svelte";
  import MarkdownCodeSpan from "./markdown-components/MarkdownCodeSpan.svelte";
  import MarkdownTable from "./markdown-components/MarkdownTable.svelte";
  import MarkdownHtml from "./markdown-components/MarkdownHtml.svelte";
  import MarkdownParagraph from "./markdown-components/MarkdownParagraph.svelte";
  import MarkdownLink from "./markdown-components/MarkdownLink.svelte";
  import MarkdownText from "./markdown-components/MarkdownText.svelte";
  import MarkdownDef from "./markdown-components/MarkdownDef.svelte";
  import MarkdownDel from "./markdown-components/MarkdownDel.svelte";
  import MarkdownEm from "./markdown-components/MarkdownEm.svelte";
  import MarkdownHr from "./markdown-components/MarkdownHr.svelte";
  import MarkdownStrong from "./markdown-components/MarkdownStrong.svelte";
  import MarkdownImage from "./markdown-components/MarkdownImage.svelte";
  import MarkdownSpace from "./markdown-components/MarkdownSpace.svelte";
  import MarkdownTeX from "./markdown-components/MarkdownTeX.svelte";
  import MarkdownTeXBlock from "./markdown-components/MarkdownTeXBlock.svelte";

  const markdownComponents = {
    blockquote: MarkdownBloquote,
    heading: MarkdownHeading,
    list: MarkdownList,
    list_item: MarkdownListItem,
    br: MarkdownBr,
    code: MarkdownCode,
    codespan: MarkdownCodeSpan,
    table: MarkdownTable,
    html: MarkdownHtml,
    paragraph: MarkdownParagraph,
    link: MarkdownLink,
    text: MarkdownText,
    def: MarkdownDef,
    del: MarkdownDel,
    em: MarkdownEm,
    hr: MarkdownHr,
    strong: MarkdownStrong,
    image: MarkdownImage,
    space: MarkdownSpace,
    texInline: MarkdownTeX,
    texBlock: MarkdownTeXBlock,
  } as Record<string, any>;
</script>

<script lang="ts">
  import MarkdownTokens from "./MarkdownTokens.svelte";

  let { token } = $props();

  const MarkdownComponent = $derived.by(() => {
    const comp = markdownComponents[token.type];

    if (!comp) {
      console.error(
        `No markdown component found for token type: ${token.type}`,
      );
      return null;
    }

    return comp;
  });
</script>

{#if MarkdownComponent}
  <MarkdownComponent {token}>
    {#if "tokens" in token && token["tokens"]}
      <MarkdownTokens tokens={token["tokens"]} />
    {:else}
      {token.raw}
    {/if}
  </MarkdownComponent>
{/if}
