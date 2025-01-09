<script lang="ts">
  import { ProgressRing } from "@skeletonlabs/skeleton-svelte";
  let { transparent = false } = $props();
</script>

<div
  class="fixed inset-0 flex items-center justify-center z-50"
  class:card={!transparent}
  class:pointer-events-none={transparent}
>
  <ProgressRing value={null} />
</div>
