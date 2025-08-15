<script lang="ts">
  import { Play, Download } from 'lucide-svelte';
  
  let {
    attachment,
    showGallery = false,
    onGalleryOpen,
  }: {
    attachment: any;
    showGallery?: boolean;
    onGalleryOpen: () => void;
  } = $props();

  let videoElement: HTMLVideoElement;
  let isLoading = $state(true);
  let hasError = $state(false);
  let isPlaying = $state(false);

  function handleVideoLoad() {
    isLoading = false;
  }

  function handleVideoError() {
    isLoading = false;
    hasError = true;
  }

  function handleVideoClick() {
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

  function handlePlayPause(e: Event) {
    e.stopPropagation();
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
    }
  }

  function handleVideoPlay() {
    isPlaying = true;
  }

  function handleVideoPause() {
    isPlaying = false;
  }
</script>

<div class="video-preview relative group">
  {#if isLoading}
    <div class="flex items-center justify-center h-48 bg-surface-100-900 rounded animate-pulse">
      <span class="text-surface-500-500-token">Loading...</span>
    </div>
  {:else if hasError}
    <div class="flex items-center justify-center h-48 bg-surface-100-900 rounded text-red-500">
      <span>Failed to load video</span>
    </div>
  {:else}
    <video
      bind:this={videoElement}
      src={attachment.fileUrl || attachment.dataUrl}
      class="rounded object-contain max-w-[240px] max-h-[200px]"
      onloadeddata={handleVideoLoad}
      onerror={handleVideoError}
      onplay={handleVideoPlay}
      onpause={handleVideoPause}
      onclick={handleVideoClick}
      controls
    >
      <track kind="captions" />
    </video>
    
    {#if showGallery}
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
        <button class="btn-icon bg-white/90 hover:bg-white" onclick={handleVideoClick}>
          <Play size={16} />
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
