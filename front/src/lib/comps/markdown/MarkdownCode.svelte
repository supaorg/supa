<script lang="ts">
  import type { Tokens } from "marked";
  import { CodeBlock } from "@skeletonlabs/skeleton";

  export let token: Tokens.Code;

  let language: string | undefined;
  let code: string;

  $: {
    language = token.lang ? token.lang : undefined;
    code = token.text;
  }
</script>

<div class="my-4">
  <CodeBlock {language} {code} />
</div>
