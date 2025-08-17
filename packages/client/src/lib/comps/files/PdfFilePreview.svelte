<script lang="ts">
  import { Download } from 'lucide-svelte';
  import type { ResolvedFileInfo } from '../../utils/fileResolver';
  
  let {
    fileInfo,
    showGallery = false,
  }: {
    fileInfo: ResolvedFileInfo;
    showGallery?: boolean;
  } = $props();

  let isLoading = $state(true);
  let hasError = $state(false);

  function handleIframeLoad() {
    isLoading = false;
  }

  function handleIframeError() {
    isLoading = false;
    hasError = true;
  }

  function handleDownload(e: Event) {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = fileInfo.url;
    link.download = fileInfo.name;
    link.click();
  }
</script>

<div class="pdf-preview relative group">
  {#if isLoading}
    <div class="flex items-center justify-center h-48 bg-surface-100-900 rounded animate-pulse">
      <span class="text-surface-500-500-token">Loading PDF...</span>
    </div>
  {:else if hasError}
    <div class="flex items-center justify-center h-48 bg-surface-100-900 rounded text-red-500">
      <span>Failed to load PDF</span>
    </div>
  {:else}
    <div class="relative">
      <iframe 
        src={fileInfo.url} 
        class="rounded w-[240px] h-[200px] border-0"
        title={fileInfo.name}
        onload={handleIframeLoad}
        onerror={handleIframeError}
      />
      
      {#if showGallery}
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div class="btn-icon bg-white/90">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
          </div>
        </div>
      {/if}
      
      <button 
        class="absolute top-2 right-2 btn-icon bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
        onclick={handleDownload}
      >
        <Download size={14} />
      </button>
    </div>
  {/if}
</div>
