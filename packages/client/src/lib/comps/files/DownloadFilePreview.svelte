<script lang="ts">
  import { Download } from 'lucide-svelte';
  import { formatFileSize, getFileIcon } from '@sila/client/utils/filePreview';
  import type { ResolvedFileInfo } from '../../utils/fileResolver';
  
  export let fileInfo: ResolvedFileInfo;

  function handleDownload(e: Event) {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = fileInfo.url;
    link.download = fileInfo.name;
    link.click();
  }
</script>

<div class="download-preview p-3 border rounded-lg bg-surface-50-950 hover:bg-surface-100-900 transition-colors">
  <div class="flex items-center gap-3">
    <div class="text-2xl">{getFileIcon(fileInfo.mimeType)}</div>
    <div class="flex-1 min-w-0">
      <div class="font-medium text-sm truncate">{fileInfo.name}</div>
      <div class="text-xs opacity-60">
        {fileInfo.mimeType} • {formatFileSize(fileInfo.size)}
      </div>
    </div>
    <button class="btn-icon hover:preset-tonal" onclick={handleDownload}>
      <Download size={16} />
    </button>
  </div>
</div>
