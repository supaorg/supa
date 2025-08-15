# File Preview and Gallery System Proposal

## Executive Summary

This proposal outlines a comprehensive solution for improving file preview and download functionality in Sila's chat system. The solution introduces a unified file preview system with a gallery interface for viewing files and downloading non-previewable content.

## Current State Analysis

### Existing File Display System
- **Images**: Displayed inline with borders (now removed)
- **Videos**: Basic HTML5 video player
- **PDFs**: Embedded iframe
- **Text Files**: Inline content with loading states
- **Other Files**: Simple name display with borders

### Current Limitations
- No unified file preview system
- Limited file type support for previews
- No gallery view for better file viewing experience
- Inconsistent UI for different file types
- No download functionality for non-previewable files
- No high-level file viewing interface

## Proposed Solution

### 1. File Type Classification System

#### Previewable File Types
```typescript
// packages/client/src/lib/utils/filePreview.ts
export interface FilePreviewConfig {
  canPreview: boolean;
  previewType: 'image' | 'video' | 'pdf' | 'text' | 'code' | 'download';
  gallerySupport: boolean;
  maxPreviewSize?: number; // in bytes
  supportedFormats: string[];
}

export const FILE_PREVIEW_CONFIGS: Record<string, FilePreviewConfig> = {
  // Images - Full preview support
  'image/jpeg': { canPreview: true, previewType: 'image', gallerySupport: true, supportedFormats: ['jpg', 'jpeg'] },
  'image/png': { canPreview: true, previewType: 'image', gallerySupport: true, supportedFormats: ['png'] },
  'image/gif': { canPreview: true, previewType: 'image', gallerySupport: true, supportedFormats: ['gif'] },
  'image/webp': { canPreview: true, previewType: 'image', gallerySupport: true, supportedFormats: ['webp'] },
  'image/svg+xml': { canPreview: true, previewType: 'image', gallerySupport: true, supportedFormats: ['svg'] },
  'image/avif': { canPreview: true, previewType: 'image', gallerySupport: true, supportedFormats: ['avif'] },
  
  // Videos - Preview with controls
  'video/mp4': { canPreview: true, previewType: 'video', gallerySupport: true, supportedFormats: ['mp4'] },
  'video/webm': { canPreview: true, previewType: 'video', gallerySupport: true, supportedFormats: ['webm'] },
  'video/ogg': { canPreview: true, previewType: 'video', gallerySupport: true, supportedFormats: ['ogv'] },
  'video/quicktime': { canPreview: true, previewType: 'video', gallerySupport: true, supportedFormats: ['mov'] },
  
  // Documents - Preview in iframe
  'application/pdf': { canPreview: true, previewType: 'pdf', gallerySupport: true, supportedFormats: ['pdf'] },
  
  // Text files - Preview with syntax highlighting
  'text/plain': { canPreview: true, previewType: 'text', gallerySupport: true, supportedFormats: ['txt'] },
  'text/markdown': { canPreview: true, previewType: 'text', gallerySupport: true, supportedFormats: ['md', 'markdown'] },
  'text/html': { canPreview: true, previewType: 'text', gallerySupport: true, supportedFormats: ['html', 'htm'] },
  'text/css': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['css'] },
  'text/javascript': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['js'] },
  'application/json': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['json'] },
  'text/xml': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['xml'] },
  'text/csv': { canPreview: true, previewType: 'text', gallerySupport: true, supportedFormats: ['csv'] },
  
  // Code files - Preview with syntax highlighting
  'application/x-python': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['py'] },
  'text/x-java-source': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['java'] },
  'text/x-c++src': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['cpp', 'cc'] },
  'text/x-csrc': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['c'] },
  'text/x-csharp': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['cs'] },
  'text/x-php': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['php'] },
  'text/x-ruby': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['rb'] },
  'text/x-go': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['go'] },
  'text/x-rust': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['rs'] },
  'text/x-swift': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['swift'] },
  'text/x-kotlin': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['kt'] },
  'text/x-scala': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['scala'] },
  'text/x-shellscript': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['sh', 'bash'] },
  'text/x-msdos-batch': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['bat'] },
  'application/x-powershell': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['ps1'] },
  'text/x-yaml': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['yml', 'yaml'] },
  'text/x-toml': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['toml'] },
  'text/x-ini': { canPreview: true, previewType: 'code', gallerySupport: true, supportedFormats: ['ini', 'cfg', 'conf'] },
  'text/x-log': { canPreview: true, previewType: 'text', gallerySupport: true, supportedFormats: ['log'] },
  'text/tab-separated-values': { canPreview: true, previewType: 'text', gallerySupport: true, supportedFormats: ['tsv'] },
  
  // Non-previewable files - Download only
  'application/zip': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['zip'] },
  'application/x-rar-compressed': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['rar'] },
  'application/x-7z-compressed': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['7z'] },
  'application/x-tar': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['tar'] },
  'application/x-gzip': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['gz'] },
  'application/x-bzip2': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['bz2'] },
  'application/x-executable': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['exe', 'app', 'bin'] },
  'application/x-msdownload': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['exe', 'msi'] },
  'application/x-dmg': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['dmg'] },
  'application/x-deb': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['deb'] },
  'application/x-rpm': { canPreview: false, previewType: 'download', gallerySupport: false, supportedFormats: ['rpm'] },
};

export function getFilePreviewConfig(mimeType: string): FilePreviewConfig {
  return FILE_PREVIEW_CONFIGS[mimeType] || {
    canPreview: false,
    previewType: 'download',
    gallerySupport: false,
    supportedFormats: []
  };
}

export function isPreviewableFile(mimeType: string): boolean {
  return getFilePreviewConfig(mimeType).canPreview;
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function getMimeTypeFromExtension(extension: string): string {
  for (const [mimeType, config] of Object.entries(FILE_PREVIEW_CONFIGS)) {
    if (config.supportedFormats.includes(extension)) {
      return mimeType;
    }
  }
  return 'application/octet-stream';
}
```

### 2. Unified File Preview Component

#### FilePreview Component
```svelte
<!-- packages/client/src/lib/comps/files/FilePreview.svelte -->
<script lang="ts">
  import { getFilePreviewConfig, isPreviewableFile } from '@sila/client/utils/filePreview';
  import ImageFilePreview from './ImageFilePreview.svelte';
  import VideoFilePreview from './VideoFilePreview.svelte';
  import PdfFilePreview from './PdfFilePreview.svelte';
  import TextFilePreview from './TextFilePreview.svelte';
  import CodeFilePreview from './CodeFilePreview.svelte';
  import DownloadFilePreview from './DownloadFilePreview.svelte';
  import { clientState } from '@sila/client/state/clientState.svelte';

  export let attachment: any;
  export let showGallery = false;

  let previewConfig = $derived(getFilePreviewConfig(attachment.mimeType));
  let isPreviewable = $derived(isPreviewableFile(attachment.mimeType));

  function openGallery() {
    if (previewConfig.gallerySupport) {
      clientState.layout.swins.open('file-gallery', {
        attachments: [attachment],
        initialIndex: 0
      }, `Viewing ${attachment.name}`);
    }
  }

  function handleFileClick() {
    if (isPreviewable && previewConfig.gallerySupport) {
      openGallery();
    } else if (!isPreviewable) {
      // For non-previewable files, open download dialog
      clientState.layout.swins.open('file-download', {
        attachment
      }, `Download ${attachment.name}`);
    }
  }
</script>

<div class="file-preview" class:clickable={isPreviewable || !previewConfig.canPreview}>
  {#if isPreviewable}
    {#if previewConfig.previewType === 'image'}
      <ImageFilePreview {attachment} {showGallery} onGalleryOpen={openGallery} />
    {:else if previewConfig.previewType === 'video'}
      <VideoFilePreview {attachment} {showGallery} onGalleryOpen={openGallery} />
    {:else if previewConfig.previewType === 'pdf'}
      <PdfFilePreview {attachment} {showGallery} onGalleryOpen={openGallery} />
    {:else if previewConfig.previewType === 'text'}
      <TextFilePreview {attachment} {showGallery} onGalleryOpen={openGallery} />
    {:else if previewConfig.previewType === 'code'}
      <CodeFilePreview {attachment} {showGallery} onGalleryOpen={openGallery} />
    {/if}
  {:else}
    <DownloadFilePreview {attachment} onclick={handleFileClick} />
  {/if}
</div>

<style>
  .file-preview {
    position: relative;
  }
  
  .file-preview.clickable {
    cursor: pointer;
  }
  
  .file-preview.clickable:hover {
    opacity: 0.8;
  }
</style>
```

### 3. Specialized Preview Components

#### ImageFilePreview Component
```svelte
<!-- packages/client/src/lib/comps/files/ImageFilePreview.svelte -->
<script lang="ts">
  import { Zoom, Download } from 'lucide-svelte';
  
  export let attachment: any;
  export let showGallery = false;
  export let onGalleryOpen: () => void;

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
    // Trigger download
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
          <Zoom size={16} />
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
```

#### DownloadFilePreview Component
```svelte
<!-- packages/client/src/lib/comps/files/DownloadFilePreview.svelte -->
<script lang="ts">
  import { Download, File } from 'lucide-svelte';
  
  export let attachment: any;
  export let onclick: () => void;

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function getFileIcon(mimeType: string) {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    if (mimeType.includes('exe') || mimeType.includes('app')) return '⚙️';
    return '📎';
  }
</script>

<div class="download-preview p-3 border rounded-lg bg-surface-50-950 hover:bg-surface-100-900 transition-colors cursor-pointer" onclick={onclick}>
  <div class="flex items-center gap-3">
    <div class="text-2xl">{getFileIcon(attachment.mimeType)}</div>
    <div class="flex-1 min-w-0">
      <div class="font-medium text-sm truncate">{attachment.name}</div>
      <div class="text-xs opacity-60">
        {attachment.mimeType} • {formatFileSize(attachment.size)}
      </div>
    </div>
    <button class="btn-icon hover:preset-tonal">
      <Download size={16} />
    </button>
  </div>
</div>
```

### 4. Gallery System (SWins-based)

#### File Gallery Component
```svelte
<!-- packages/client/src/lib/comps/files/FileGallery.svelte -->
<script lang="ts">
  import { ChevronLeft, ChevronRight, X, Download, ZoomIn, ZoomOut } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import FilePreview from './FilePreview.svelte';
  import { getFilePreviewConfig } from '@sila/client/utils/filePreview';
  import { clientState } from '@sila/client/state/clientState.svelte';

  export let attachments: any[] = [];
  export let initialIndex = 0;

  let currentIndex = $state(initialIndex);
  let zoomLevel = $state(1);
  let isFullscreen = $state(false);

  let currentAttachment = $derived(attachments[currentIndex]);
  let currentConfig = $derived(getFilePreviewConfig(currentAttachment?.mimeType));

  function nextFile() {
    if (currentIndex < attachments.length - 1) {
      currentIndex++;
      zoomLevel = 1;
    }
  }

  function prevFile() {
    if (currentIndex > 0) {
      currentIndex--;
      zoomLevel = 1;
    }
  }

  function closeGallery() {
    clientState.layout.swins.pop();
  }

  function handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowRight':
        nextFile();
        break;
      case 'ArrowLeft':
        prevFile();
        break;
      case 'Escape':
        closeGallery();
        break;
      case '+':
      case '=':
        zoomIn();
        break;
      case '-':
        zoomOut();
        break;
    }
  }

  function zoomIn() {
    zoomLevel = Math.min(zoomLevel * 1.2, 5);
  }

  function zoomOut() {
    zoomLevel = Math.max(zoomLevel / 1.2, 0.1);
  }

  function resetZoom() {
    zoomLevel = 1;
  }

  function toggleFullscreen() {
    isFullscreen = !isFullscreen;
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<div class="file-gallery fixed inset-0 z-50 bg-black/90 flex flex-col" class:fullscreen={isFullscreen}>
  <!-- Header -->
  <div class="flex items-center justify-between p-4 bg-black/50 text-white">
    <div class="flex items-center gap-4">
      <button class="btn-icon text-white hover:bg-white/20" onclick={closeGallery}>
        <X size={20} />
      </button>
      <div>
        <h2 class="font-medium">{currentAttachment?.name}</h2>
        <p class="text-sm opacity-70">
          {currentIndex + 1} of {attachments.length} • {currentConfig.previewType}
        </p>
      </div>
    </div>
    
    <div class="flex items-center gap-2">
      {#if currentConfig.previewType === 'image'}
        <button class="btn-icon text-white hover:bg-white/20" onclick={zoomOut}>
          <ZoomOut size={16} />
        </button>
        <button class="btn-icon text-white hover:bg-white/20" onclick={resetZoom}>
          {Math.round(zoomLevel * 100)}%
        </button>
        <button class="btn-icon text-white hover:bg-white/20" onclick={zoomIn}>
          <ZoomIn size={16} />
        </button>
      {/if}
      <button class="btn-icon text-white hover:bg-white/20" onclick={toggleFullscreen}>
        {isFullscreen ? '⛶' : '⛶'}
      </button>
    </div>
  </div>

  <!-- Content -->
  <div class="flex-1 flex items-center justify-center p-4">
    <div class="relative max-w-full max-h-full">
      <!-- Navigation buttons -->
      {#if attachments.length > 1}
        <button 
          class="absolute left-4 top-1/2 -translate-y-1/2 btn-icon bg-black/50 text-white hover:bg-black/70 z-10"
          class:invisible={currentIndex === 0}
          onclick={prevFile}
        >
          <ChevronLeft size={24} />
        </button>
        
        <button 
          class="absolute right-4 top-1/2 -translate-y-1/2 btn-icon bg-black/50 text-white hover:bg-black/70 z-10"
          class:invisible={currentIndex === attachments.length - 1}
          onclick={nextFile}
        >
          <ChevronRight size={24} />
        </button>
      {/if}

      <!-- File content -->
      <div class="file-content" style="transform: scale({zoomLevel});">
        {#if currentConfig.previewType === 'image'}
          <img 
            src={currentAttachment.fileUrl || currentAttachment.dataUrl} 
            alt={currentAttachment.name}
            class="max-w-full max-h-full object-contain"
          />
        {:else if currentConfig.previewType === 'video'}
          <video 
            src={currentAttachment.fileUrl || currentAttachment.dataUrl} 
            controls 
            class="max-w-full max-h-full"
          />
        {:else if currentConfig.previewType === 'pdf'}
          <iframe 
            src={currentAttachment.fileUrl || currentAttachment.dataUrl} 
            class="w-[800px] h-[600px] border-0"
            title={currentAttachment.name}
          />
        {:else if currentConfig.previewType === 'text' || currentConfig.previewType === 'code'}
          <div class="bg-white text-black p-6 rounded max-w-4xl max-h-[80vh] overflow-auto">
            <pre class="text-sm"><code>{currentAttachment.content || 'Content not available'}</code></pre>
          </div>
        {:else}
          <div class="bg-white text-black p-8 rounded text-center">
            <div class="text-6xl mb-4">📎</div>
            <h3 class="text-xl font-medium mb-2">{currentAttachment.name}</h3>
            <p class="text-gray-600 mb-4">
              This file type cannot be previewed
            </p>
            <button class="btn preset-filled-primary-500" onclick={() => {
              const link = document.createElement('a');
              link.href = currentAttachment.fileUrl || currentAttachment.dataUrl;
              link.download = currentAttachment.name;
              link.click();
            }}>
              <Download size={16} class="mr-2" />
              Download File
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Thumbnail navigation -->
  {#if attachments.length > 1}
    <div class="p-4 bg-black/50">
      <div class="flex gap-2 overflow-x-auto">
        {#each attachments as attachment, index}
          <button 
            class="flex-shrink-0 w-16 h-16 border-2 rounded overflow-hidden"
            class:border-primary-500={index === currentIndex}
            class:border-white/30={index !== currentIndex}
            onclick={() => currentIndex = index}
          >
            {#if getFilePreviewConfig(attachment.mimeType).previewType === 'image'}
              <img 
                src={attachment.fileUrl || attachment.dataUrl} 
                alt={attachment.name}
                class="w-full h-full object-cover"
              />
            {:else}
              <div class="w-full h-full flex items-center justify-center bg-surface-100-900 text-surface-500-500-token">
                📎
              </div>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .file-gallery.fullscreen {
    z-index: 9999;
  }
  
  .file-content {
    transition: transform 0.2s ease;
  }
</style>
```

### 5. Integration with Chat Messages

#### Updated ChatAppMessage.svelte
```svelte
<!-- packages/client/src/lib/comps/apps/ChatAppMessage.svelte -->
<script lang="ts">
  // ... existing imports ...
  import FilePreview from '@sila/client/comps/files/FilePreview.svelte';
  import { isPreviewableFile } from '@sila/client/utils/filePreview';

  // ... existing code ...

  function openFileGallery(attachments: any[], initialIndex: number) {
    clientState.layout.swins.open('file-gallery', {
      attachments,
      initialIndex
    }, `Viewing files`);
  }
</script>

<!-- Replace the existing attachment rendering with: -->
{#if attachments && attachments.length > 0}
  <div class="mt-2 flex flex-wrap gap-2">
    {#each attachments as att, index (att.id)}
      <div class="relative">
        <FilePreview 
          attachment={att} 
          showGallery={isPreviewableFile(att.mimeType)}
          onGalleryOpen={() => openFileGallery(attachments, index)}
        />
      </div>
    {/each}
  </div>
{/if}
```

### 6. SWins Registration

#### Update swinsLayout.ts
```typescript
// packages/client/src/lib/state/swinsLayout.ts
import FileGallery from '../comps/files/FileGallery.svelte';
import FileDownload from '../comps/files/FileDownload.svelte';

export function setupSwins(): SWins {
  const swins = new SWins();

  // ... existing registrations ...
  
  swins.register('file-gallery', FileGallery);
  swins.register('file-download', FileDownload);

  return swins;
}
```

## Implementation Plan

### Phase 1: Core Infrastructure
1. Create file preview configuration system
2. Implement FilePreview component
3. Create specialized preview components (Image, Video, PDF, Text, Code, Download)
4. Add file type detection utilities

### Phase 2: Gallery System
1. Implement FileGallery component using SWins
2. Add keyboard navigation and zoom controls
3. Create thumbnail navigation
4. Add fullscreen support

### Phase 3: Integration
1. Update ChatAppMessage.svelte to use new FilePreview
2. Update SendMessageForm.svelte attachment previews
3. Add gallery support to FilesApp.svelte
4. Test with various file types

### Phase 4: Polish
1. Add loading states and error handling
2. Implement file download functionality
3. Add file size formatting
4. Optimize performance for large files

## Benefits

1. **Unified Experience**: Consistent file preview across the application
2. **Better UX**: Gallery view for images and media files
3. **Enhanced Functionality**: Download support for non-previewable files
4. **Scalability**: Easy to add new file type support
5. **Accessibility**: Keyboard navigation and screen reader support
6. **Performance**: Efficient file loading and caching

## Technical Considerations

1. **File Size Limits**: Implement size limits for preview to prevent memory issues
2. **Caching**: Cache file content for better performance
3. **Security**: Sanitize file content to prevent XSS attacks
4. **Mobile Support**: Ensure gallery works well on mobile devices
5. **Offline Support**: Handle cases where files are not available

This proposal provides a comprehensive solution for file preview and download functionality that integrates seamlessly with Sila's existing architecture while providing a modern, user-friendly experience.
