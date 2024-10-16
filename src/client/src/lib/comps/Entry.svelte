<script lang="ts">
  // Floating UI for Popups
  import {
    computePosition,
    autoUpdate,
    flip,
    shift,
    offset,
    arrow,
  } from "@floating-ui/dom";

  import { storePopup } from "@skeletonlabs/skeleton";
  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

  import { onMount } from "svelte";
  import Loading from "./basic/Loading.svelte";
  import TauriWindowSetup from "./tauri/TauriWindowSetup.svelte";
  import { isTauri } from "$lib/tauri/isTauri";

  type State = "initializing" | "needsSpace" | "needsSetup" | "ready";
  let state: State = "initializing";

  onMount(() => {
    // @TODO:
    // 1) check if we have space ref try to load it
    // 2) if no space ref - propose to create one or create automatically
  });
</script>

{#if state === "initializing"}
  <Loading />
{:else if state === "needsSpace"}
  Needs Space
{:else if state === "needsSetup"}
  Needs Setup
{:else if state === "ready"}
  <slot />
{/if}

{#if isTauri()}
  <TauriWindowSetup />
{/if}
