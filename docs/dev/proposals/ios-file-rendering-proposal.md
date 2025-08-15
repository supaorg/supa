# iOS File Rendering Proposal for Sila Mobile App

## Executive Summary

This proposal outlines a comprehensive approach to implement file viewing and rendering capabilities in the Sila iOS mobile app using Capacitor. The solution leverages the existing Sila file storage architecture while providing a unified API for rendering various file types in web views within the app.

## Current State Analysis

### Existing Sila File Architecture

Sila already has a robust file handling system:

1. **Content-Addressed Storage (CAS)**: Files are stored by SHA-256 hash in workspace directories
2. **FileStore API**: Provides `putBytes()`, `getBytes()`, `getDataUrl()` methods
3. **FileResolver**: Resolves file references to data URLs for UI rendering
4. **Files AppTree**: Logical file organization with metadata
5. **Workspace-based Storage**: Files are stored in iCloud-synced workspace folders

### Current Mobile Implementation

- **Capacitor Setup**: Basic Capacitor configuration exists
- **SvelteKit Integration**: Mobile app uses the same client package as desktop
- **No File System**: Mobile lacks the `AppFileSystem` implementation
- **No File Rendering**: No web view or file preview capabilities

## Proposed Solution

### 1. iOS File System Implementation

Create an iOS-specific `AppFileSystem` implementation using Capacitor's Filesystem plugin:

```typescript
// packages/mobile/src/ios/iosFileSystem.ts
import { Filesystem, Directory } from '@capacitor/filesystem';
import type { AppFileSystem, FileEntry, FileHandle, WatchEvent, UnwatchFn } from '@sila/core';

export class IOSFileSystem implements AppFileSystem {
  private basePath: string;

  constructor(workspacePath: string) {
    this.basePath = workspacePath;
  }

  async readDir(path: string): Promise<FileEntry[]> {
    const fullPath = this.resolvePath(path);
    const result = await Filesystem.readdir({
      path: fullPath,
      directory: Directory.Documents
    });
    
    return result.files.map(file => ({
      name: file.name,
      isDirectory: file.type === 'directory',
      isFile: file.type === 'file'
    }));
  }

  async readBinaryFile(path: string): Promise<Uint8Array> {
    const fullPath = this.resolvePath(path);
    const result = await Filesystem.readFile({
      path: fullPath,
      directory: Directory.Documents
    });
    
    return new Uint8Array(Buffer.from(result.data, 'base64'));
  }

  async writeTextFile(path: string, content: string): Promise<void> {
    const fullPath = this.resolvePath(path);
    await Filesystem.writeFile({
      path: fullPath,
      data: content,
      directory: Directory.Documents
    });
  }

  // ... other methods implementation
}
```

### 2. iCloud Workspace Integration

Leverage iOS's iCloud Documents folder for workspace storage:

```typescript
// packages/mobile/src/ios/workspaceManager.ts
import { Filesystem, Directory } from '@capacitor/filesystem';

export class IOSWorkspaceManager {
  private iCloudPath: string;

  constructor() {
    // Use iCloud Documents folder for workspace storage
    this.iCloudPath = 'iCloud.com.silaintelligence.sila/workspaces';
  }

  async createWorkspace(workspaceId: string): Promise<string> {
    const workspacePath = `${this.iCloudPath}/${workspaceId}`;
    
    await Filesystem.mkdir({
      path: workspacePath,
      directory: Directory.Documents,
      recursive: true
    });

    return workspacePath;
  }

  async getWorkspacePath(workspaceId: string): Promise<string> {
    return `${this.iCloudPath}/${workspaceId}`;
  }
}
```

### 3. File Rendering API

Create a unified file rendering service that supports multiple file types:

```typescript
// packages/mobile/src/services/fileRenderer.ts
export interface FileRenderOptions {
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
}

export interface FileRenderResult {
  canRender: boolean;
  renderType: 'webview' | 'native' | 'download';
  url?: string;
  data?: string;
  error?: string;
}

export class FileRenderer {
  private supportedMimeTypes = {
    // Images
    'image/jpeg': 'webview',
    'image/png': 'webview',
    'image/gif': 'webview',
    'image/webp': 'webview',
    'image/svg+xml': 'webview',
    
    // Documents
    'application/pdf': 'webview',
    'text/plain': 'webview',
    'text/html': 'webview',
    'text/markdown': 'webview',
    'text/css': 'webview',
    'text/javascript': 'webview',
    'application/json': 'webview',
    
    // Code files
    'application/xml': 'webview',
    'text/xml': 'webview',
    'text/csv': 'webview',
    
    // Archives (download only)
    'application/zip': 'download',
    'application/x-rar-compressed': 'download',
    
    // Media (native player)
    'video/mp4': 'native',
    'video/quicktime': 'native',
    'audio/mpeg': 'native',
    'audio/wav': 'native'
  };

  async renderFile(
    fileData: Uint8Array | string,
    options: FileRenderOptions
  ): Promise<FileRenderResult> {
    const mimeType = options.mimeType || 'application/octet-stream';
    const renderType = this.supportedMimeTypes[mimeType] || 'download';

    switch (renderType) {
      case 'webview':
        return this.renderInWebView(fileData, options);
      case 'native':
        return this.renderNative(fileData, options);
      case 'download':
        return this.prepareDownload(fileData, options);
      default:
        return { canRender: false, renderType: 'download' };
    }
  }

  private async renderInWebView(
    fileData: Uint8Array | string,
    options: FileRenderOptions
  ): Promise<FileRenderResult> {
    const mimeType = options.mimeType || 'text/plain';
    
    if (typeof fileData === 'string') {
      return {
        canRender: true,
        renderType: 'webview',
        data: fileData
      };
    }

    // Convert binary data to base64
    const base64 = Buffer.from(fileData).toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return {
      canRender: true,
      renderType: 'webview',
      data: dataUrl
    };
  }

  private async renderNative(
    fileData: Uint8Array | string,
    options: FileRenderOptions
  ): Promise<FileRenderResult> {
    // Save to temporary file and return file URL
    const tempPath = await this.saveToTempFile(fileData, options.fileName);
    
    return {
      canRender: true,
      renderType: 'native',
      url: tempPath
    };
  }

  private async prepareDownload(
    fileData: Uint8Array | string,
    options: FileRenderOptions
  ): Promise<FileRenderResult> {
    // Save to documents folder for user access
    const downloadPath = await this.saveToDocuments(fileData, options.fileName);
    
    return {
      canRender: false,
      renderType: 'download',
      url: downloadPath
    };
  }
}
```

### 4. Web View Component

Create a Svelte component for rendering files in web views:

```svelte
<!-- packages/mobile/src/components/FileViewer.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { FileRenderer } from '../services/fileRenderer';
  import type { FileRenderResult } from '../services/fileRenderer';

  export let fileData: Uint8Array | string;
  export let mimeType: string;
  export let fileName: string;
  export let fileSize: number;

  let renderResult: FileRenderResult;
  let iframeElement: HTMLIFrameElement;
  let errorMessage: string;

  const fileRenderer = new FileRenderer();

  onMount(async () => {
    try {
      renderResult = await fileRenderer.renderFile(fileData, {
        mimeType,
        fileName,
        fileSize
      });

      if (renderResult.canRender && renderResult.renderType === 'webview') {
        // Set iframe source for web view rendering
        if (iframeElement && renderResult.data) {
          iframeElement.src = renderResult.data;
        }
      }
    } catch (error) {
      errorMessage = `Failed to render file: ${error.message}`;
    }
  });
</script>

<div class="file-viewer">
  {#if errorMessage}
    <div class="error">
      <p>{errorMessage}</p>
      <button on:click={() => window.history.back()}>Go Back</button>
    </div>
  {:else if renderResult}
    {#if renderResult.renderType === 'webview' && renderResult.canRender}
      <iframe
        bind:this={iframeElement}
        class="file-iframe"
        sandbox="allow-same-origin allow-scripts"
        title="File Viewer"
      />
    {:else if renderResult.renderType === 'native'}
      <div class="native-player">
        <p>Opening in native player...</p>
        <a href={renderResult.url} class="native-link">Open File</a>
      </div>
    {:else}
      <div class="download-prompt">
        <p>This file type cannot be previewed.</p>
        <a href={renderResult.url} class="download-link" download={fileName}>
          Download {fileName}
        </a>
      </div>
    {/if}
  {:else}
    <div class="loading">Loading file...</div>
  {/if}
</div>

<style>
  .file-viewer {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .file-iframe {
    width: 100%;
    height: 100%;
    border: none;
    flex: 1;
  }

  .error, .loading, .native-player, .download-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
    text-align: center;
  }

  .native-link, .download-link {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: #007AFF;
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
  }
</style>
```

### 5. File Browser Integration

Integrate file rendering with the existing Sila file browser:

```typescript
// packages/mobile/src/components/FileBrowser.svelte
<script lang="ts">
  import { FileResolver } from '@sila/core';
  import FileViewer from './FileViewer.svelte';
  import type { Space } from '@sila/core';

  export let space: Space;
  export let currentPath: string = '/';

  let files: any[] = [];
  let selectedFile: any = null;
  let showViewer = false;

  const fileResolver = new FileResolver(space);

  async function loadFiles() {
    const fileStore = space.getFileStore();
    if (!fileStore) return;

    // Load files from current path using FilesTreeData
    // Implementation depends on existing file tree structure
  }

  async function openFile(file: any) {
    try {
      // Resolve file to get binary data
      const resolved = await fileResolver.resolveFileReference(
        { tree: file.tree, vertex: file.vertex },
        file,
        space.getFileStore()
      );

      if (resolved) {
        selectedFile = {
          data: resolved.dataUrl,
          mimeType: resolved.mimeType,
          name: resolved.name,
          size: resolved.size
        };
        showViewer = true;
      }
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  }
</script>

<div class="file-browser">
  <div class="toolbar">
    <button on:click={() => currentPath = '/'}>Home</button>
    <span class="current-path">{currentPath}</span>
  </div>

  <div class="file-list">
    {#each files as file}
      <div class="file-item" on:click={() => openFile(file)}>
        <div class="file-icon">
          {#if file.isDirectory}
            📁
          {:else}
            📄
          {/if}
        </div>
        <div class="file-info">
          <div class="file-name">{file.name}</div>
          {#if !file.isDirectory}
            <div class="file-size">{file.size} bytes</div>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  {#if showViewer && selectedFile}
    <div class="file-viewer-overlay">
      <div class="viewer-header">
        <button on:click={() => showViewer = false}>Close</button>
        <span>{selectedFile.name}</span>
      </div>
      <FileViewer
        fileData={selectedFile.data}
        mimeType={selectedFile.mimeType}
        fileName={selectedFile.name}
        fileSize={selectedFile.size}
      />
    </div>
  {/if}
</div>
```

### 6. Capacitor Plugin Integration

Add necessary Capacitor plugins for enhanced file handling:

```json
// packages/mobile/package.json additions
{
  "dependencies": {
    "@capacitor/filesystem": "^7.0.0",
    "@capacitor/preferences": "^7.0.0",
    "@capacitor/share": "^7.0.0",
    "@capacitor/device": "^7.0.0"
  }
}
```

### 7. iOS Configuration

Update iOS configuration for file handling:

```swift
// packages/mobile/ios/App/App/AppDelegate.swift
import Capacitor
import UIKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Configure file sharing
        let documentsPath = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)[0]
        let workspacePath = (documentsPath as NSString).appendingPathComponent("workspaces")
        
        // Create workspace directory if it doesn't exist
        if !FileManager.default.fileExists(atPath: workspacePath) {
            try? FileManager.default.createDirectory(atPath: workspacePath, withIntermediateDirectories: true)
        }
        
        return true
    }
}
```

## Implementation Phases

### Phase 1: Core File System
1. Implement `IOSFileSystem` class
2. Create `IOSWorkspaceManager` for iCloud integration
3. Add Capacitor Filesystem plugin
4. Basic file reading/writing capabilities

### Phase 2: File Rendering API
1. Implement `FileRenderer` service
2. Support for common file types (images, PDFs, text files)
3. Create `FileViewer` Svelte component
4. Basic web view rendering

### Phase 3: File Browser Integration
1. Integrate with existing Sila file tree structure
2. Create mobile-optimized file browser UI
3. File selection and opening functionality
4. Navigation between folders

### Phase 4: Advanced Features
1. Native media player integration
2. File sharing capabilities
3. Offline file access
4. Performance optimizations

## Technical Considerations

### Security
- **Sandboxed Web Views**: All file rendering happens in sandboxed iframes
- **File Access Control**: Only access files within workspace directories
- **Data Validation**: Validate file types and sizes before rendering

### Performance
- **Lazy Loading**: Load file content only when needed
- **Caching**: Cache frequently accessed files
- **Memory Management**: Proper cleanup of large file data

### User Experience
- **Loading States**: Clear feedback during file operations
- **Error Handling**: Graceful fallbacks for unsupported files
- **Offline Support**: Access to previously downloaded files

### iCloud Integration
- **Automatic Sync**: Workspace files sync automatically via iCloud
- **Conflict Resolution**: Handle file conflicts gracefully
- **Storage Management**: Monitor and manage iCloud storage usage

## Benefits

1. **Unified Experience**: Consistent file handling across desktop and mobile
2. **iCloud Integration**: Seamless file synchronization
3. **Rich File Support**: View various file types without external apps
4. **Offline Access**: Files available offline after initial sync
5. **Security**: Sandboxed file rendering for safety

## Risks and Mitigation

### Risks
1. **iCloud Storage Limits**: Large workspaces may exceed free storage
2. **File Type Support**: Some file types may not render properly
3. **Performance**: Large files may cause memory issues
4. **iOS App Store Approval**: File handling features must comply with guidelines

### Mitigation
1. **Storage Monitoring**: Implement storage usage warnings
2. **Fallback Rendering**: Provide download option for unsupported files
3. **Memory Management**: Implement proper cleanup and streaming for large files
4. **Guidelines Compliance**: Follow Apple's file handling guidelines

## Conclusion

This proposal provides a comprehensive solution for file rendering on iOS that leverages Sila's existing architecture while adding mobile-specific capabilities. The implementation is phased to allow for iterative development and testing, ensuring a robust and user-friendly file viewing experience on iOS devices.

The solution maintains consistency with Sila's desktop experience while taking advantage of iOS-specific features like iCloud integration and native file handling capabilities.