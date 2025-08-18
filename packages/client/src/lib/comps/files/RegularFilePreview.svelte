<script lang="ts">
  import { getFileIcon, formatFileSize } from '@sila/client/utils/filePreview';
  import type { ResolvedFileInfo } from '../../utils/fileResolver';
  
  let {
    fileInfo,
    showGallery = false,
  }: {
    fileInfo: ResolvedFileInfo;
    showGallery?: boolean;
  } = $props();
</script>

<div class="regular-file-preview p-3 border rounded-lg bg-surface-50-950 hover:bg-surface-100-900 transition-colors">
  <div class="flex items-center gap-3">
    <div class="text-2xl">{getFileIcon(fileInfo.mimeType || 'application/octet-stream')}</div>
    <div class="flex-1 min-w-0">
      <div class="font-medium text-sm truncate">{fileInfo.name}</div>
      <div class="text-xs opacity-60">
        {fileInfo.mimeType || 'Unknown type'} • {formatFileSize(fileInfo.size || 0)}
      </div>
    </div>
  </div>
</div>
