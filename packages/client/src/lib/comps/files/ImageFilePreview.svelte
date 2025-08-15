<script lang="ts">
  import { ZoomIn, Download } from 'lucide-svelte';
  
  let {
    attachment,
    showGallery = false,
    onGalleryOpen,
  }: {
    attachment: any;
    showGallery?: boolean;
    onGalleryOpen: () => void;
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

  function handleImageClick() {
    if (showGallery) {
      onGalleryOpen();
    }
  }

  function handleDownload(e: Event) {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = attachment.fileUrl || attachment.dataUrl;
    link.download = attachment.name;
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
      src={attachment.fileUrl || attachment.dataUrl}
      alt={attachment.name}
      class="rounded object-contain max-w-[240px] max-h-[200px]"
      onload={handleImageLoad}
      onerror={handleImageError}
      onclick={handleImageClick}
    />
    
    {#if showGallery}
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
        <button class="btn-icon bg-white/90 hover:bg-white" onclick={handleImageClick}>
          <ZoomIn size={16} />
        </button>
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
