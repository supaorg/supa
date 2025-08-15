<script lang="ts">
  import { FileText, Download } from 'lucide-svelte';
  
  let {
    attachment,
    showGallery = false,
    onGalleryOpen,
  }: {
    attachment: any;
    showGallery?: boolean;
    onGalleryOpen: () => void;
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

  function handlePdfClick() {
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
        src={attachment.fileUrl || attachment.dataUrl} 
        class="rounded w-[240px] h-[200px] border-0"
        title={attachment.name}
        onload={handleIframeLoad}
        onerror={handleIframeError}
        onclick={handlePdfClick}
      />
      
      {#if showGallery}
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button class="btn-icon bg-white/90 hover:bg-white" onclick={handlePdfClick}>
            <FileText size={16} />
          </button>
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
