<script lang="ts">
  import { X } from "lucide-svelte";
  import type { Ttabs } from "ttabs-svelte";
  
  let { 
    onClose 
  }: { 
    onClose: (e: Event) => void 
  } = $props();
</script>

<button
  class="ttabs-tab-close flex items-center justify-center"
  style="display: var(--ttabs-show-close-button, none)"
  onclick={onClose}
>
  <X size={14} class="text-surface-500 hover:text-surface-700-300" />
</button>

<style>
  .ttabs-tab-close {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    width: var(--ttabs-tab-close-size);
    height: var(--ttabs-tab-close-size);
    border-radius: var(--ttabs-tab-close-border-radius);
    transition: background-color 0.1s ease;
  }
  
  .ttabs-tab-close:hover {
    background-color: var(--ttabs-close-button-hover-bg);
  }
</style> 