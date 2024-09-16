<script lang="ts">
  import type { Tokens } from "marked";
  import { CodeBlock, storeHighlightJs } from "@skeletonlabs/skeleton";

  export let token: Tokens.Code;

  const availableLangs = $storeHighlightJs.listLanguages();
  let language: string;
  let code: string;

  $: {
    language = token.lang ? token.lang : 'plaintext';
    code = token.text;

    if (!availableLangs.includes(language)) {
      console.warn(`Language "${language}" not supported by highlight.js`);
      language = 'plaintext';
    }
  }
</script>

<div class="my-4">
  <CodeBlock {language} {code} />
</div>
