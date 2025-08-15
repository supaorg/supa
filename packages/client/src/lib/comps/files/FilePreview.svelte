<script lang="ts">
  import { getFilePreviewConfig } from '@sila/client/utils/filePreview';
  import ImageFilePreview from './ImageFilePreview.svelte';
  import VideoFilePreview from './VideoFilePreview.svelte';
  import PdfFilePreview from './PdfFilePreview.svelte';
  import TextFilePreview from './TextFilePreview.svelte';
  import DownloadFilePreview from './DownloadFilePreview.svelte';
  
  let {
    attachment,
    showGallery = false,
    onGalleryOpen,
  }: {
    attachment: any;
    showGallery?: boolean;
    onGalleryOpen: () => void;
  } = $props();

  let previewConfig = $derived(getFilePreviewConfig(attachment.mimeType));
</script>

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
