<script lang="ts">
  import { onMount } from 'svelte';
  import { getFilePreviewConfig } from '@sila/client/utils/filePreview';
  import { ClientFileResolver } from '@sila/client/lib/utils/fileResolver';
  import ImageFilePreview from './ImageFilePreview.svelte';
  import VideoFilePreview from './VideoFilePreview.svelte';
  import PdfFilePreview from './PdfFilePreview.svelte';
  import TextFilePreview from './TextFilePreview.svelte';
  import DownloadFilePreview from './DownloadFilePreview.svelte';
  import type { FileReference, ResolvedFileInfo } from '@sila/client/lib/utils/fileResolver';
  
  let {
    fileRef,
    showGallery = false,
    onGalleryOpen,
  }: {
    fileRef: FileReference;
    showGallery?: boolean;
    onGalleryOpen: () => void;
  } = $props();

  let resolvedFile: ResolvedFileInfo | null = $state(null);
  let isLoading = $state(true);
  let hasError = $state(false);
  let errorMessage = $state('');

  let previewConfig = $derived(
    resolvedFile?.mimeType
      ? getFilePreviewConfig(resolvedFile.mimeType)
      : { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: [] }
  );

  async function loadFile() {
    try {
      isLoading = true;
      hasError = false;
      errorMessage = '';
      
      const fileInfo = await ClientFileResolver.resolveFileReference(fileRef);
      if (fileInfo) {
        resolvedFile = fileInfo;
      } else {
        hasError = true;
        errorMessage = 'Failed to load file';
      }
    } catch (error) {
      hasError = true;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      isLoading = false;
    }
  }

  function handleClick() {
    if (showGallery && previewConfig.gallerySupport) {
      onGalleryOpen();
    }
  }

  onMount(() => {
    loadFile();
  });
</script>

<div class="file-preview-wrapper" onclick={handleClick}>
  {#if isLoading}
    <div class="flex items-center justify-center h-48 bg-surface-100-900 rounded animate-pulse">
      <span class="text-surface-500-500-token">Loading...</span>
    </div>
  {:else if hasError}
    <div class="flex items-center justify-center h-48 bg-surface-100-900 rounded text-red-500">
      <span>Failed to load file: {errorMessage}</span>
    </div>
  {:else if resolvedFile}
    {#if previewConfig.previewType === 'image'}
      <ImageFilePreview fileInfo={resolvedFile} {showGallery} />
    {:else if previewConfig.previewType === 'video'}
      <VideoFilePreview fileInfo={resolvedFile} {showGallery} />
    {:else if previewConfig.previewType === 'pdf'}
      <PdfFilePreview fileInfo={resolvedFile} {showGallery} />
    {:else if previewConfig.previewType === 'text' || previewConfig.previewType === 'code'}
      <TextFilePreview fileInfo={resolvedFile} {showGallery} />
    {:else}
      <DownloadFilePreview fileInfo={resolvedFile} />
    {/if}
  {:else}
    <div class="flex items-center justify-center h-48 bg-surface-100-900 rounded">
      <span class="text-surface-500-500-token">No file data</span>
    </div>
  {/if}
</div>
