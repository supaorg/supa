<script lang="ts">
  import type { Snippet } from "svelte";
  import { swins } from "./swinsLayout";

  let {
    children,
    component,
    props,
    title,
    className,
    pop,
    popTo,
    onclick,
  }: {
    children: Snippet;
    component: string;
    props?: Record<string, any>;
    title: string;
    className?: string;
    pop?: 'current' | 'all';
    popTo?: string;
    onclick?: () => void;
  } = $props();

  function handleClick() {
    if (pop === 'current') {
      swins.pop();
    } else if (pop === 'all') {
      swins.clear();
    } else if (popTo) {
      swins.popTo(popTo);
    }

    swins.open(component, props, title);

    if (onclick) {
      onclick();
    }
  }
</script>

<button class={className} onclick={handleClick}>
  {@render children?.()}
</button>
