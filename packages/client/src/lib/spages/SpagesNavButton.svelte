<script lang="ts">
  import { spages } from "./spagesLayout";

  let { component, title }: { component: string, title: string } = $props();
</script>

<button
  class="btn preset-filled"
  onclick={() => spages.open(component, {}, title)}
>
  {title}
</button>
