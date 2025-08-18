# File Preview Gallery System Proposal (v2)

## Executive Summary

This proposal outlines a simplified file preview gallery system using popover-based modals instead of SWins. The system focuses on displaying a single active file with architecture that supports multiple files for future expansion.

## Current State Analysis

### Existing File Display System
- **Images**: Displayed inline with ImageFilePreview component
- **Other Files**: Displayed with RegularFilePreview component (icon + name + format)
- **File Types**: Unified through FilePreviewConfig with user-friendly names and icons

### Current Limitations
- No gallery view for better file viewing experience
- No way to view files in full-screen or larger format
- No zoom or navigation controls for images
- No download functionality for files

## Proposed Solution

### 1. Gallery System Architecture

#### Gallery State Management
```typescript
// packages/client/src/lib/state/galleryState.svelte.ts
interface GalleryState {
  isOpen: boolean;
  activeFile: ResolvedFileInfo | null;
  files: ResolvedFileInfo[]; // For future multi-item support
  currentIndex: number; // For future multi-item support
}

export const galleryState = createState<GalleryState>({
  isOpen: false,
  activeFile: null,
  files: [],
  currentIndex: 0
});

export function openGallery(resolvedFile: ResolvedFileInfo) {
  galleryState.set({
    isOpen: true,
    activeFile: resolvedFile,
    files: [resolvedFile], // Single file for v1
    currentIndex: 0
  });
}

export function closeGallery() {
  galleryState.set({
    isOpen: false,
    activeItem: null,
    items: [],
    currentIndex: 0
  });
}

// Future functions for multi-item support:
// export function openGalleryWithItems(items: GalleryItem[], initialIndex: number)
// export function nextItem()
// export function prevItem()
```

### 2. Gallery Modal Component

#### FileGalleryModal Component
```svelte
<!-- packages/client/src/lib/comps/files/FileGalleryModal.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { X } from 'lucide-svelte';
  import { getFilePreviewConfig } from '@sila/client/utils/filePreview';
  import { galleryState, closeGallery } from '../../state/galleryState.svelte';

  let activeFile = $derived(galleryState.activeFile);
  let isOpen = $derived(galleryState.isOpen);

  let previewConfig = $derived.by(() => {
    if (!activeFile?.mimeType) return null;
    return getFilePreviewConfig(activeFile.mimeType);
  });

  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      closeGallery();
    }
  }

  function handleBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      closeGallery();
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

{#if isOpen && activeFile && previewConfig}
  <div 
    class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
    onclick={handleBackdropClick}
  >
    <!-- Close button -->
    <button 
      class="absolute top-4 right-4 btn-icon bg-black/50 text-white hover:bg-black/70 z-10"
      onclick={closeGallery}
    >
      <X size={20} />
    </button>

    <!-- Content -->
    <div class="relative max-w-full max-h-full p-4">
      {#if previewConfig.previewType === 'image'}
        <img 
          src={activeFile.url} 
          alt={activeFile.name}
          class="max-w-full max-h-full object-contain"
        />
      {:else if previewConfig.previewType === 'video'}
        <video 
          src={activeFile.url} 
          controls 
          class="max-w-full max-h-full"
          autoplay
        />
      {:else if previewConfig.previewType === 'pdf'}
        <iframe 
          src={activeFile.url} 
          class="w-[800px] h-[600px] border-0"
          title={activeFile.name}
        />
      {:else if previewConfig.previewType === 'text' || previewConfig.previewType === 'code'}
        <div class="bg-white text-black p-6 rounded max-w-4xl max-h-[80vh] overflow-auto">
          <pre class="text-sm"><code>{activeFile.content || 'Content not available'}</code></pre>
        </div>
      {:else}
        <div class="bg-white text-black p-8 rounded text-center max-w-md">
          <div class="text-6xl mb-4">{previewConfig.icon}</div>
          <h3 class="text-xl font-medium mb-2">{activeFile.name}</h3>
          <p class="text-gray-600 mb-4">
            This file type cannot be previewed
          </p>
          <button 
            class="btn preset-filled-primary-500" 
            onclick={() => {
              const link = document.createElement('a');
              link.href = activeFile.url;
              link.download = activeFile.name;
              link.click();
            }}
          >
            Download File
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
```

### 3. Integration with File Preview Components

#### Update FilePreview Component
```svelte
<!-- packages/client/src/lib/comps/files/FilePreview.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { getFilePreviewConfig } from "@sila/client/utils/filePreview";
  import { ClientFileResolver } from "../../utils/fileResolver";
  import ImageFilePreview from "./ImageFilePreview.svelte";
  import RegularFilePreview from "./RegularFilePreview.svelte";
  import type {
    FileReference,
    ResolvedFileInfo,
  } from "../../utils/fileResolver";

  let {
    fileRef,
    showGallery = false,
    onGalleryOpen,
  }: {
    fileRef: FileReference;
    showGallery?: boolean;
    onGalleryOpen?: (resolvedFile: ResolvedFileInfo) => void;
  } = $props();

  let resolvedFile: ResolvedFileInfo | null = $state(null);
  let isLoading = $state(true);
  let hasError = $state(false);
  let errorMessage = $state("");

  let previewConfig = $derived.by(() => {
    const mimeType = resolvedFile?.mimeType;
    return getFilePreviewConfig(mimeType);
  });

  async function loadFile() {
    try {
      isLoading = true;
      hasError = false;
      errorMessage = "";

      if (!fileRef || !fileRef.tree || !fileRef.vertex) {
        hasError = true;
        errorMessage = "Invalid file reference";
        return;
      }

      const fileInfo = await ClientFileResolver.resolveFileReference(fileRef);
      if (fileInfo) {
        resolvedFile = fileInfo;
      } else {
        hasError = true;
        errorMessage = "Failed to load file";
      }
    } catch (error) {
      hasError = true;
      errorMessage = error instanceof Error ? error.message : "Unknown error";
    } finally {
      isLoading = false;
    }
  }

  function handleClick() {
    if (showGallery && previewConfig.gallerySupport && resolvedFile && onGalleryOpen) {
      onGalleryOpen(resolvedFile);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (showGallery && previewConfig.gallerySupport && resolvedFile && onGalleryOpen) {
        onGalleryOpen(resolvedFile);
      }
    }
  }

  onMount(() => {
    loadFile();
  });
</script>

<div 
  class="file-preview-wrapper" 
  onclick={handleClick}
  onkeydown={handleKeydown}
  {...(showGallery && previewConfig.gallerySupport ? { tabindex: 0, role: "button" } : {})}
>
  {#if isLoading}
    <div class="flex items-center justify-center h-48 bg-surface-100-900 rounded animate-pulse">
      <span class="text-surface-500-500-token">Loading...</span>
    </div>
  {:else if hasError}
    <div class="flex items-center justify-center h-48 bg-surface-100-900 rounded text-red-500">
      <span>Failed to load file: {errorMessage}</span>
    </div>
  {:else if resolvedFile}
    {#if previewConfig.previewType === "image"}
      <ImageFilePreview fileInfo={resolvedFile} {showGallery} />
    {:else}
      <RegularFilePreview fileInfo={resolvedFile} {showGallery} />
    {/if}
  {:else}
    <div class="flex items-center justify-center h-48 bg-surface-100-900 rounded">
      <span class="text-surface-500-500-token">No file data</span>
    </div>
  {/if}
</div>
```

### 4. App Integration

#### Update SilaApp Component
```svelte
<!-- packages/client/src/lib/comps/SilaApp.svelte -->
<script lang="ts">
  // ... existing imports ...
  import FileGalleryModal from './files/FileGalleryModal.svelte';
</script>

<!-- Add to the main app template -->
<div class="sila-app">
  <!-- ... existing content ... -->
  
  <!-- Gallery Modal -->
  <FileGalleryModal />
</div>
```

#### Update ChatAppMessage Component
```svelte
<!-- packages/client/src/lib/comps/apps/ChatAppMessage.svelte -->
<script lang="ts">
  // ... existing imports ...
  import { openGallery } from '../../state/galleryState.svelte';
  import FilePreview from '../files/FilePreview.svelte';
</script>

<!-- In the attachments section -->
{#if attachments && attachments.length > 0}
  <div class="mt-2 flex flex-wrap gap-2">
    {#each attachments as att (att.id)}
      {#if att.file && att.file.tree && att.file.vertex}
        <FilePreview 
          fileRef={att.file}
          showGallery={true}
          onGalleryOpen={(resolvedFile) => {
            openGallery(resolvedFile);
          }}
        />
      {:else}
        <!-- Fallback for legacy attachments -->
        <div class="p-2 border rounded text-sm text-surface-500-500-token">
          {att.name || 'Unknown file'}
        </div>
      {/if}
    {/each}
  </div>
{/if}
```

### 5. Future Multi-Item Support Architecture

#### Gallery Navigation (Future)
```typescript
// Future enhancement for multi-item galleries
interface GalleryNavigation {
  nextItem(): void;
  prevItem(): void;
  goToItem(index: number): void;
  hasNext(): boolean;
  hasPrev(): boolean;
}

// Example usage in FileGalleryModal:
{#if items.length > 1}
  <div class="absolute left-4 top-1/2 -translate-y-1/2">
    <button 
      class="btn-icon bg-black/50 text-white hover:bg-black/70"
      class:invisible={!hasPrev()}
      onclick={prevItem}
    >
      <ChevronLeft size={24} />
    </button>
  </div>
  
  <div class="absolute right-4 top-1/2 -translate-y-1/2">
    <button 
      class="btn-icon bg-black/50 text-white hover:bg-black/70"
      class:invisible={!hasNext()}
      onclick={nextItem}
    >
      <ChevronRight size={24} />
    </button>
  </div>
{/if}
```

## Implementation Plan

### Phase 1: Core Gallery System (v1)
1. Create gallery state management
2. Implement FileGalleryModal component with simple image viewing
3. Add gallery integration to FilePreview component
4. Test with single file display

### Phase 2: Enhanced Features
1. Add download functionality for all file types
2. Add support for video, PDF, and text file previews
3. Improve accessibility and keyboard navigation
4. Add loading states and error handling

### Phase 3: Multi-Item Support (Future)
1. Extend gallery state for multiple items
2. Add navigation controls (prev/next)
3. Implement thumbnail navigation
4. Add swipe gestures for mobile

## Benefits

1. **Simple Architecture**: Popover-based modal instead of complex SWins integration
2. **Single Responsibility**: Focus on one active item for v1
3. **Future-Ready**: Architecture supports multi-item galleries
4. **Consistent UX**: Same gallery experience across all file types
5. **Keyboard Support**: Full keyboard navigation and shortcuts
6. **Mobile Friendly**: Touch-friendly controls and responsive design

## Technical Considerations

1. **Performance**: Efficient file loading and caching
2. **Memory Management**: Proper cleanup when gallery closes
3. **Accessibility**: Screen reader support and keyboard navigation
4. **Mobile Support**: Touch gestures and responsive design
5. **File Size Limits**: Handle large files gracefully
6. **PDF Viewing**: Uses Chromium's native PDF viewer via iframe (works in Electron and modern browsers)

This simplified approach provides a solid foundation for file gallery functionality while keeping the implementation straightforward and maintainable.
