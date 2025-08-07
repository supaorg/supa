<script lang="ts">
  import { ProgressRing } from "@skeletonlabs/skeleton-svelte";
  let { transparent = false } = $props();

  // @TODO: consder calling a globalLoading.show() and globalLoading.hide()
  // and then enable/disable one loading component in the root of SilaApp.svelte
  // so multiple parts can rely on a single loading component that won't 
  // flicker because independent loading components get overlaying on each other.
</script>

<div
  class="fixed inset-0 flex items-center justify-center z-50"
  class:card={!transparent}
  class:pointer-events-none={transparent}
>
  <ProgressRing value={null} />
</div>
