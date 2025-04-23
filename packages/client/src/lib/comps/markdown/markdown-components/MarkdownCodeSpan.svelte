<script lang="ts">
import type { Tokens } from 'marked'

let { token } = $props<{
  token: Tokens.Codespan
}>();
</script>

<code class="bg-surface-100-900 p-[3px]">{token.raw.slice(1, token.raw.length - 1)}</code>
