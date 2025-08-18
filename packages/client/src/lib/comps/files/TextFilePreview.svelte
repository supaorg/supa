<script lang="ts">
  import type { ResolvedFileInfo } from '../../utils/fileResolver';
  
  let {
    fileInfo,
    showGallery = false,
  }: {
    fileInfo: ResolvedFileInfo;
    showGallery?: boolean;
  } = $props();
</script>

<div class="text-preview border rounded-lg p-3 bg-surface-50-950">
  <div class="flex items-center justify-between mb-2">
    <span class="text-sm font-medium">{fileInfo.name}</span>
    <span class="text-xs opacity-60">
      {fileInfo.mimeType || 'text'} • {fileInfo.size ? `${fileInfo.size} bytes` : 'unknown size'}
    </span>
  </div>
  
  <div class="relative">
    <div class="flex items-center justify-center h-48 text-surface-500-500-token">
      <div class="text-center">
        <div class="text-2xl mb-2">
          {#if fileInfo.mimeType === 'text/markdown' || fileInfo.mimeType === 'text/x-markdown'}
            📝
          {:else}
            📄
          {/if}
        </div>
        <div class="text-sm">
          {fileInfo.mimeType === 'text/markdown' || fileInfo.mimeType === 'text/x-markdown' ? 'Markdown' : 'Text'} file
        </div>
        <div class="text-xs opacity-60 mt-1">
          Open in gallery to view content
        </div>
      </div>
    </div>
  </div>
</div>
