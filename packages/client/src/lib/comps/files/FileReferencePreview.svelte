<script lang="ts">
  import FilePreview from './FilePreview.svelte';
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
</script>

<FilePreview {fileRef} {showGallery} {onGalleryOpen} />