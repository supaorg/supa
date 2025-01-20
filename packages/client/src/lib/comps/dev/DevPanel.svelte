<script lang="ts">
  import { isDevMode } from "$lib/stores/devMode";
  import { spaceInspectorOpen } from "$lib/stores/devMode";
</script>

<div class="flex gap-4 items-center justify-between p-2">
  <div class="flex items-center gap-2">
    <div class="text-sm text-surface-600-300-token">🚧 Supa v1.0.0 in Dev Mode</div>
    <button class="btn btn-sm variant-soft" on:click={() => $isDevMode = false}>Exit Dev Mode</button>
  </div>
  <button class="btn btn-sm variant-soft" on:click={() => $spaceInspectorOpen ? ($spaceInspectorOpen = false) : ($spaceInspectorOpen = true)}>
    {$spaceInspectorOpen ? 'Close Space Inspector' : 'Open Space Inspector'}
  </button>
</div>
