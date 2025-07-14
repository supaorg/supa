<script lang="ts">
  import type { Snippet } from "svelte";
  import { clientState } from "@client/state/clientState.svelte";

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
      clientState.layout.swins.pop();
    } else if (pop === 'all') {
      clientState.layout.swins.clear();
    } else if (popTo) {
      clientState.layout.swins.popTo(popTo);
    }

    clientState.layout.swins.open(component, props, title);

    if (onclick) {
      onclick();
    }
  }
</script>

<button class={className} onclick={handleClick}>
  {@render children?.()}
</button>
