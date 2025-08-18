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

<div class="video-preview relative group">
  <div class="flex items-center justify-center h-48 bg-surface-100-900 rounded">
    <div class="text-center">
      <div class="text-2xl mb-2">🎥</div>
      <div class="text-sm">
        {fileInfo.mimeType?.includes('video/') ? fileInfo.mimeType.split('/')[1].toUpperCase() : 'Video'} file
      </div>
      <div class="text-xs opacity-60 mt-1">
        {fileInfo.size ? `${Math.round(fileInfo.size / 1024)} KB` : 'Unknown size'}
      </div>
      <div class="text-xs opacity-60 mt-1">
        Open in gallery to play
      </div>
    </div>
  </div>
  
  {#if showGallery}
    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
      <div class="btn-icon bg-white/90">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5,3 19,12 5,21"/>
        </svg>
      </div>
    </div>
  {/if}
</div>
