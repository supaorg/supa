<script lang="ts">
  import { Download } from 'lucide-svelte';
  import type { ResolvedFileInfo } from '@sila/client/lib/utils/fileResolver';
  
  let {
    fileInfo,
    showGallery = false,
  }: {
    fileInfo: ResolvedFileInfo;
    showGallery?: boolean;
  } = $props();

  let imageElement: HTMLImageElement;
  let isLoading = $state(true);
  let hasError = $state(false);

  function handleImageLoad() {
    isLoading = false;
  }

  function handleImageError() {
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

<div class="image-preview relative group">
  {#if isLoading}
    <div class="flex items-center justify-center h-48 bg-surface-100-900 rounded animate-pulse">
      <span class="text-surface-500-500-token">Loading...</span>
    </div>
  {:else if hasError}
    <div class="flex items-center justify-center h-48 bg-surface-100-900 rounded text-red-500">
      <span>Failed to load image</span>
    </div>
  {:else}
    <img
      bind:this={imageElement}
      src={fileInfo.url}
      alt={fileInfo.name}
      class="rounded object-contain max-w-[240px] max-h-[200px]"
      onload={handleImageLoad}
      onerror={handleImageError}
    />
    
    {#if showGallery}
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div class="btn-icon bg-white/90">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
            <path d="M11 8v6"/>
            <path d="M8 11h6"/>
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
  {/if}
</div>
