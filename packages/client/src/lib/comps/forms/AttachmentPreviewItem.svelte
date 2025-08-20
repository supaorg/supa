<script lang="ts">
  import { Loader2 } from "lucide-svelte";
  import type { AttachmentPreview } from "@sila/core";

  interface AttachmentPreviewItemProps {
    attachment: AttachmentPreview & { isLoading?: boolean };
    onRemove: (id: string) => void;
  }

  let { attachment, onRemove }: AttachmentPreviewItemProps = $props();
</script>

<div class="relative group rounded-md p-1 bg-surface-100-900 {attachment.isLoading ? 'border-dashed border border-surface-300-700/50' : ''}">
  {#if attachment.isLoading}
    <!-- Loading state -->
    <div class="flex items-center gap-2 px-2 py-1">
      <Loader2 size={14} class="animate-spin text-primary-500" />
      <div class="text-xs opacity-70">
        <div class="font-medium">{attachment.name}</div>
        <div class="text-xs opacity-60">
          Processing {attachment.kind === 'image' ? 'image' : 'text file'}...
        </div>
      </div>
    </div>
  {:else}
    <!-- Completed state -->
    {#if attachment.kind === 'text' && attachment.metadata}
      <div class="text-xs opacity-70 border rounded px-2 py-1">
        <div class="font-medium">{attachment.name}</div>
        <div class="text-xs opacity-60">
          {attachment.metadata.language} • {attachment.metadata.lineCount} lines • {attachment.metadata.wordCount} words
        </div>
      </div>
    {:else if attachment.kind === 'image' && attachment.dataUrl}
      <img src={attachment.dataUrl} alt={attachment.name} class="max-h-16 max-w-24 rounded" />
    {:else}
      <div class="text-xs opacity-70">{attachment.name}</div>
    {/if}
  {/if}
  
  <button 
    class="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-surface-200-800 hover:bg-surface-300-700 flex items-center justify-center"
    onclick={() => onRemove(attachment.id)} 
    aria-label="Remove attachment"
  >
    ×
  </button>
</div>
