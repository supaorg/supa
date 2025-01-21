<script lang="ts">
  import type { Tokens } from "marked";
  import MarkdownTokens from "../MarkdownTokens.svelte";

  let { token }: { token: Tokens.Table } = $props();
</script>

<table>
  <thead>
    <tr>
      {#each token.header as item}
        <th scope="col">
          <MarkdownTokens tokens={item.tokens} />
        </th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each token.rows as row}
      <tr>
        {#each row as col}
          <td>
            <MarkdownTokens tokens={col.tokens} />
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
