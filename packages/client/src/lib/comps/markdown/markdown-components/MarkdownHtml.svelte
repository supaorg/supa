<script lang="ts">
  import type { Tokens } from "marked";

  let { token } = $props<{
    token: Tokens.HTML;
  }>();
</script>

{@html token.text}
