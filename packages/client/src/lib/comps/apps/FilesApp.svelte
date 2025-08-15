<script lang="ts">
  import { onMount } from "svelte";
  import { FilesAppData } from "@sila/core";
  import type { Vertex } from "@sila/core";
  import { Folder, File as FileIcon, Upload, Plus } from "lucide-svelte";
  import { clientState } from "@sila/client/state/clientState.svelte";

  let { data }: { data: FilesAppData } = $props();

  let filesRoot = $state<Vertex | undefined>(undefined);
  let currentFolder = $state<Vertex | undefined>(undefined);
  let path = $state<Vertex[]>([]);

  let children = $state<Vertex[]>([]);
  let folders = $state<Vertex[]>([]);
  let files = $state<Vertex[]>([]);

  let unobserveCurrent: (() => void) | undefined;
  
  // Upload state
  let isDragOver = $state(false);
  let isUploading = $state(false);
  let fileInputEl: HTMLInputElement | null = $state(null);

  onMount(() => {
    filesRoot = data.filesVertex;
    if (!filesRoot) return;
    path = [filesRoot];
    currentFolder = filesRoot;
    refreshLists();
    observeCurrentFolder();
  });

  function refreshLists() {
    if (!currentFolder) {
      children = [];
      folders = [];
      files = [];
      return;
    }

    children = currentFolder.children;
    // Folders have _n as their name (not "folder"), files have _n: "file"
    folders = children.filter((v) => {
      const n = v.getProperty("_n");
      return n && n !== "file";
    });
    files = children.filter((v) => v.getProperty("_n") === "file");
  }

  function observeCurrentFolder() {
    unobserveCurrent?.();
    if (!currentFolder) return;
    unobserveCurrent = currentFolder.observe((events) => {
      if (events.some((e) => e.type === "children" || e.type === "property")) {
        refreshLists();
      }
    });
  }

  function enterFolder(folder: Vertex) {
    path = [...path, folder];
    currentFolder = folder;
    refreshLists();
    observeCurrentFolder();
  }

  function goToCrumb(index: number) {
    if (index < 0 || index >= path.length) return;
    path = path.slice(0, index + 1);
    currentFolder = path[path.length - 1];
    refreshLists();
    observeCurrentFolder();
  }

  $effect(() => {
    return () => {
      unobserveCurrent?.();
    };
  });

  function displayName(v: Vertex): string {
    // For folders, use _n property; for files, use name property
    const folderName = v.getProperty("_n");
    if (folderName && folderName !== "file") {
      return folderName as string;
    }
    return (v.name as string | null) ?? "";
  }

  function isImageFile(file: Vertex): boolean {
    const mimeType = file.getProperty("mimeType") as string;
    return mimeType?.startsWith("image/") ?? false;
  }

  function getFileUrl(file: Vertex): string {
    const hash = file.getProperty("hash") as string;
    const mimeType = file.getProperty("mimeType") as string;
    
    // Get space ID from the space object, not the app tree
    const spaceId = (data as any).space.getId();
    
    // Use the electron file system API if available
    if ((window as any).electronFileSystem) {
      return (window as any).electronFileSystem.getFileUrl(spaceId, hash, mimeType);
    }
    
    // Fallback to data URL if electron API not available
    return "";
  }

  // Upload functions
  function openFilePicker() {
    fileInputEl?.click();
  }

  async function onFilesSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;
    
    await uploadFiles(Array.from(files));
    
    // Reset input to allow re-selecting the same file
    if (fileInputEl) fileInputEl.value = "";
  }

  async function uploadFiles(fileList: File[]) {
    if (isUploading || !currentFolder) return;
    
    isUploading = true;
    
    try {
      const store = (data as any).space.getFileStore();
      if (!store) {
        console.error("File store not available");
        return;
      }

      const filesTree = await FilesAppData.getOrCreateDefaultFilesTree((data as any).space);
      
      for (const file of fileList) {
        try {
          // Step 1: Process file (convert HEIC if needed)
          const processedFile = await processFileForUpload(file);
          
          // Step 2: Resize image if needed (2048x2048 max)
          const optimizedFile = await optimizeImageSize(processedFile);
          
          // Step 3: Convert to data URL
          const dataUrl = await toDataUrl(optimizedFile);
          
          // Step 4: Upload to CAS (deduplication happens here)
          const put = await store.putDataUrl(dataUrl);
          
          // Step 5: Get image dimensions if it's an image
          let width: number | undefined;
          let height: number | undefined;
          let originalDimensions: string | undefined;
          if (optimizedFile.type.startsWith('image/')) {
            const dims = await getImageDimensions(dataUrl);
            width = dims?.width;
            height = dims?.height;
            
            // If the file was resized, get original dimensions
            if (processedFile !== file || optimizedFile !== processedFile) {
              const originalDims = await getImageDimensions(await toDataUrl(file));
              if (originalDims) {
                originalDimensions = `${originalDims.width}x${originalDims.height}`;
              }
            }
          }
          
          // Step 6: Create vertex with original filename but optimized data
          const { FilesTreeData } = await import("@sila/core");
          FilesTreeData.createOrLinkFile({
            filesTree,
            parentFolder: currentFolder,
            name: file.name, // Keep original filename
            hash: put.hash,  // Hash of optimized data
            mimeType: optimizedFile.type, // Optimized MIME type
            size: optimizedFile.size,
            width,
            height,
            originalFormat: file.type !== optimizedFile.type ? file.type : undefined,
            conversionQuality: file.type !== optimizedFile.type ? 0.85 : undefined,
            originalDimensions
          });
          
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      isUploading = false;
    }
  }

  function toDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function getImageDimensions(src: string): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  // HEIC Conversion Pipeline Functions
  async function processFileForUpload(file: File): Promise<File> {
    // Check if it's a HEIC file
    if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
      try {
        // Convert HEIC to JPEG
        const convertedBlob = await convertHeicToJpeg(file);
        
        // Create new File object with converted data but original name
        return new File([convertedBlob], file.name, {
          type: 'image/jpeg',
          lastModified: file.lastModified
        });
      } catch (error) {
        console.warn(`HEIC conversion failed for ${file.name}, skipping:`, error);
        throw error; // Skip this file
      }
    }
    
    // Return original file if no conversion needed
    return file;
  }

  async function convertHeicToJpeg(heicFile: File): Promise<Blob> {
    try {
      // Use heic2any library for browser-based conversion
      const { heic2any } = await import('heic2any');
      
      const jpegBlob = await heic2any({
        blob: heicFile,
        toType: 'image/jpeg',
        quality: 0.85 // Good balance of quality and size
      });
      
      return jpegBlob;
    } catch (error) {
      console.error('HEIC conversion failed:', error);
      throw new Error(`Failed to convert HEIC file: ${error.message}`);
    }
  }

  async function optimizeImageSize(file: File): Promise<File> {
    // Only process image files
    if (!file.type.startsWith('image/')) {
      return file;
    }
    
    try {
      // Get image dimensions
      const dimensions = await getImageDimensions(await toDataUrl(file));
      if (!dimensions) return file;
      
      const { width, height } = dimensions;
      const maxSize = 2048;
      
      // Check if resizing is needed
      if (width <= maxSize && height <= maxSize) {
        return file; // No resizing needed
      }
      
      // Calculate new dimensions maintaining aspect ratio
      const ratio = Math.min(maxSize / width, maxSize / height);
      const newWidth = Math.round(width * ratio);
      const newHeight = Math.round(height * ratio);
      
      // Resize image
      const resizedBlob = await resizeImage(file, newWidth, newHeight, 0.85);
      
      // Create new File object with resized data
      return new File([resizedBlob], file.name, {
        type: file.type,
        lastModified: file.lastModified
      });
    } catch (error) {
      console.warn(`Image resizing failed for ${file.name}, using original:`, error);
      return file; // Fallback to original
    }
  }

  async function resizeImage(file: File, width: number, height: number, quality: number = 0.85): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = width;
        canvas.height = height;
        
        // Draw resized image
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image for resizing'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Drag and drop handlers
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragOver = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragOver = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragOver = false;
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      uploadFiles(Array.from(files));
    }
  }
</script>

<div class="flex flex-col w-full h-full overflow-hidden">
  <div 
    class="flex-grow overflow-y-auto pt-2"
    class:bg-blue-50={isDragOver}
    class:border-2={isDragOver}
    class:border-dashed={isDragOver}
    class:border-blue-500={isDragOver}
    role="button"
    tabindex="0"
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  >
    <div class="w-full max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-2">
        <h2 class="h2">Files</h2>
        {#if currentFolder}
          <button
            class="btn btn-sm preset-outline flex items-center gap-2"
            onclick={openFilePicker}
            disabled={isUploading}
            type="button"
          >
            {#if isUploading}
              <div class="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
              Uploading...
            {:else}
              <Plus size={16} />
              Upload Files
            {/if}
          </button>
        {/if}
      </div>
      
      <!-- Hidden file input -->
      <input 
        type="file" 
        multiple 
        class="hidden" 
        bind:this={fileInputEl} 
        onchange={onFilesSelected} 
      />

      {#if !filesRoot}
        <p class="text-muted-foreground">Files root not found.</p>
      {:else}
        <!-- Breadcrumbs -->
        <div class="flex flex-wrap items-center gap-1 text-sm mb-4">
          {#each path as crumb, i (crumb.id)}
            {#if i > 0}
              <span class="opacity-50">/</span>
            {/if}
            <button
              class="px-1 py-0.5 rounded hover:bg-surface-500/10"
              onclick={() => goToCrumb(i)}
              type="button"
            >
              {displayName(crumb) || (i === 0 ? "Files" : "Unnamed")}
            </button>
          {/each}
        </div>

        <!-- Folders -->
        {#if folders.length > 0}
          <div class="mb-3">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {#each folders as folder (folder.id)}
                <button
                  class="border rounded-lg p-3 text-left hover:bg-surface-500/5"
                  onclick={() => enterFolder(folder)}
                  type="button"
                >
                  <div class="flex items-center gap-2">
                    <Folder size={16} />
                    <span class="text-sm font-medium">{displayName(folder) || "Untitled folder"}</span>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Files -->
        {#if files.length > 0}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {#each files as file (file.id)}
              <div class="border rounded-lg p-3">
                {#if isImageFile(file)}
                  <!-- Image preview -->
                  <div class="mb-2">
                    <img 
                      src={getFileUrl(file)} 
                      alt={displayName(file)}
                      class="w-full h-32 object-cover rounded border"
                      loading="lazy"
                    />
                  </div>
                {/if}
                <div class="flex items-center gap-2 mb-1">
                  <FileIcon size={16} />
                  <span class="text-sm font-medium">{displayName(file) || "Untitled"}</span>
                </div>
                <div class="text-xs text-muted-foreground space-y-0.5">
                  <div>Type: {file.getProperty("mimeType") || "Unknown"}</div>
                  {#if file.getProperty("size")}
                    <div>Size: {file.getProperty("size")} bytes</div>
                  {/if}
                  {#if file.getProperty("width") && file.getProperty("height")}
                    <div>Dimensions: {file.getProperty("width")} × {file.getProperty("height")}</div>
                  {/if}
                  {#if file.getProperty("originalFormat")}
                    <div class="text-blue-600">Converted from: {file.getProperty("originalFormat")}</div>
                  {/if}
                  {#if file.getProperty("originalDimensions")}
                    <div class="text-blue-600">Original: {file.getProperty("originalDimensions")}</div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}

        {#if folders.length === 0 && files.length === 0}
          <p class="text-muted-foreground">This folder is empty.</p>
        {/if}
      {/if}
    </div>
  </div>
</div>
