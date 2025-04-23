<script lang="ts">
  import type { Snippet } from "svelte";
  import { spages } from "./spagesLayout";

  let {
    children,
    component,
    props,
    title,
    className,
  }: { children: Snippet; component: string; props?: Record<string, any>; title: string; className?: string } = $props();
</script>

<button class={className} onclick={() => spages.open(component, props, title)}>
  {@render children?.()}
</button>
