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

  function handleDownload(e: Event) {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = fileInfo.url;
    link.download = fileInfo.name;
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
      src={fileInfo.url}
      class="rounded object-contain max-w-[240px] max-h-[200px]"
      onloadeddata={handleVideoLoad}
      onerror={handleVideoError}
      onplay={handleVideoPlay}
      onpause={handleVideoPause}
      controls
    >
      <track kind="captions" />
    </video>
    
    {#if showGallery}
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div class="btn-icon bg-white/90">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5,3 19,12 5,21"/>
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
