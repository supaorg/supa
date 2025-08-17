<script lang="ts">
  import { onMount } from 'svelte';
  import { ClientFileResolver, type ResolvedFileInfo } from '@sila/client/utils/fileResolver';
  import { getFilePreviewConfig } from '@sila/client/utils/filePreview';
  import ImageFilePreview from './ImageFilePreview.svelte';
  import VideoFilePreview from './VideoFilePreview.svelte';
  import PdfFilePreview from './PdfFilePreview.svelte';
  import TextFilePreview from './TextFilePreview.svelte';
  import DownloadFilePreview from './DownloadFilePreview.svelte';
  import type { FileReference } from '@sila/core/spaces/files/FileResolver';
  
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
      
      resolvedFile = await ClientFileResolver.resolveFileReference(fileRef);
      
      if (!resolvedFile) {
        hasError = true;
        errorMessage = 'Failed to load file';
      }
    } catch (error) {
      console.error('Error loading file:', error);
      hasError = true;
      errorMessage = 'Error loading file';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadFile();
  });

  // Create a compatible attachment object for existing preview components
  let attachment = $derived(
    resolvedFile ? {
      id: resolvedFile.id,
      name: resolvedFile.name,
      mimeType: resolvedFile.mimeType,
      size: resolvedFile.size,
      width: resolvedFile.width,
      height: resolvedFile.height,
      dataUrl: resolvedFile.dataUrl,
      fileUrl: resolvedFile.dataUrl, // For compatibility with existing components
    } : null
  );
</script>

{#if isLoading}
  <div class="flex items-center justify-center h-48 bg-surface-100-900 rounded animate-pulse">
    <span class="text-surface-500-500-token">Loading file...</span>
  </div>
{:else if hasError}
  <div class="flex items-center justify-center h-48 bg-surface-100-900 rounded text-red-500">
    <span>{errorMessage}</span>
  </div>
{:else if resolvedFile && attachment}
  {#if previewConfig.previewType === 'image'}
    <ImageFilePreview {attachment} {showGallery} {onGalleryOpen} />
  {:else if previewConfig.previewType === 'video'}
    <VideoFilePreview {attachment} {showGallery} {onGalleryOpen} />
  {:else if previewConfig.previewType === 'pdf'}
    <PdfFilePreview {attachment} {showGallery} {onGalleryOpen} />
  {:else if previewConfig.previewType === 'text' || previewConfig.previewType === 'code'}
    <TextFilePreview {attachment} {showGallery} {onGalleryOpen} />
  {:else}
    <DownloadFilePreview {attachment} onclick={onGalleryOpen} />
  {/if}
{:else}
  <div class="flex items-center justify-center h-48 bg-surface-100-900 rounded text-surface-500-500-token">
    <span>No file data available</span>
  </div>
{/if}