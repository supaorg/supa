<script lang="ts">
  import { isDevMode } from "$lib/stores/devMode";
  import { spaceInspectorOpen } from "$lib/stores/devMode";
</script>

<div class="flex gap-4 items-center p-2">
  <button class="btn btn-sm variant-soft" on:click={() => $spaceInspectorOpen = !$spaceInspectorOpen}>Toggle Inspector</button>
</div>
