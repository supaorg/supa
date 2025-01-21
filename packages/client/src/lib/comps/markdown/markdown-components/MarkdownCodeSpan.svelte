<script lang="ts">
import type { Tokens } from 'marked'

let { token } = $props<{
  token: Tokens.Codespan
}>();
</script>

<code>{token.raw.slice(1, token.raw.length - 1)}</code>
