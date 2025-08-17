<script lang="ts">
  import { formatFileSize, getFileIcon } from '@sila/client/utils/filePreview';
  import type { ResolvedFileInfo } from '../../utils/fileResolver';
  
  export let fileInfo: ResolvedFileInfo;
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

  </div>
</div>
