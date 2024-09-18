<script lang="ts">
  import Markdown from "@magidoc/plugin-svelte-marked";
  import MarkdownCode from "./MarkdownCode.svelte";
  import MarkdownLink from "./MarkdownLink.svelte";
  import MarkdownTeX from "./MarkdownTeX.svelte";
  export let source: string;
</script>

<Markdown
  {source}
  renderers={{
    code: MarkdownCode,
    link: MarkdownLink,
    inlineTex: MarkdownTeX,
    blockTex: MarkdownTeX,
  }}
/>
