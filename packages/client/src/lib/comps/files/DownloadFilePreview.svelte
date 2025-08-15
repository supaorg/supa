<script lang="ts">
  import { Download } from 'lucide-svelte';
  import { formatFileSize, getFileIcon } from '@sila/client/utils/filePreview';
  
  export let attachment: any;
  export let onclick: () => void;

  function handleDownload(e: Event) {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = attachment.fileUrl || attachment.dataUrl;
    link.download = attachment.name;
    link.click();
  }
</script>

<div class="download-preview p-3 border rounded-lg bg-surface-50-950 hover:bg-surface-100-900 transition-colors cursor-pointer" onclick={onclick}>
  <div class="flex items-center gap-3">
    <div class="text-2xl">{getFileIcon(attachment.mimeType)}</div>
    <div class="flex-1 min-w-0">
      <div class="font-medium text-sm truncate">{attachment.name}</div>
      <div class="text-xs opacity-60">
        {attachment.mimeType} • {formatFileSize(attachment.size)}
      </div>
    </div>
    <button class="btn-icon hover:preset-tonal" onclick={handleDownload}>
      <Download size={16} />
    </button>
  </div>
</div>
