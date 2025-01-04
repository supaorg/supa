<script lang="ts">
  import { ProgressRing } from '@skeletonlabs/skeleton-svelte';
  export let transparent = false;
</script>

<div class="fixed inset-0 flex items-center justify-center z-50" class:card={!transparent} class:pointer-events-none={transparent}>
  <ProgressRing value={null} />
</div>
