<script lang="ts">
import type { Tokens } from 'marked'

let { token } = $props<{
  token: Tokens.Codespan
}>();
</script>

<code class="bg-surface-200-800">{token.raw.slice(1, token.raw.length - 1)}</code>
