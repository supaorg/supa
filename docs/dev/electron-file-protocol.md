# Electron Custom File Protocol

This document describes Sila's custom `sila://` protocol implementation for serving files directly from Content-Addressed Storage (CAS) in Electron.

## Overview

The custom protocol allows Sila to serve files (images, PDFs, videos, etc.) directly from the file system without loading them into memory as data URLs. This provides:

- **Performance**: No memory overhead from base64 encoding
- **Scalability**: Large files don't cause stack overflows
- **Efficiency**: Direct file system access
- **Security**: Proper validation and access control

## Architecture

### URL Format
```
sila://spaces/{spaceId}/files/{hash}?type={mimeType}
```

**Components:**
- `spaceId`: Unique identifier for the workspace
- `hash`: SHA256 hash of the file content
- `mimeType`: Optional MIME type for proper content-type headers

**Example:**
```
sila://spaces/f1ba226099084e4db17d1d3c27dcfc2a/files/c8670ca7ac518d8350206e897e61488210d3dcf963828ea8b90d23d3f8e04d08?type=image%2Fjpeg
```

### File Path Resolution

Files are resolved using the CAS structure:
```
{spaceRoot}/space-v1/files/sha256/{hash[0:2]}/{hash[2:]}
```

**Example:**
- Hash: `c8670ca7ac518d8350206e897e61488210d3dcf963828ea8b90d23d3f8e04d08`
- Path: `/Users/dk/Documents/sila-spaces/test/space-v1/files/sha256/c8/670ca7ac518d8350206e897e61488210d3dcf963828ea8b90d23d3f8e04d08`

## Implementation

### 1. Main Process Setup

**File:** `packages/desktop/src-electron/main.js`

```javascript
// Setup custom file protocol
setupFileProtocol();

// Setup IPC handlers for space management
setupSpaceManagementIPC();
```

### 2. Protocol Handler

**File:** `packages/desktop/src-electron/fileProtocol.js`

The protocol handler uses Electron's modern `protocol.handle()` API:

```javascript
protocol.handle('sila', async (request) => {
  // Parse URL and validate format
  // Look up space and construct file path
  // Read file and return Response
});
```

**Key Features:**
- URL validation and parsing
- Space lookup via SpaceManager
- File existence checking
- Proper MIME type handling
- Error responses with appropriate HTTP status codes

### 3. Space Management

**File:** `packages/desktop/src-electron/spaceManager.js`

Manages space registration and path resolution:

```javascript
class SpaceManager {
  registerSpace(spaceId, rootPath, name, createdAt)
  getSpaceRootPath(spaceId)
  unregisterSpace(spaceId)
  hasSpace(spaceId)
  getAllSpaces()
}
```

### 4. Inter-Process Communication (IPC)

**Files:** 
- `packages/desktop/src-electron/main.js` (IPC handlers)
- `packages/desktop/src-electron/fileSystemAPI.js` (Renderer API)

Since the protocol handler runs in the main process but spaces are loaded in the renderer process, IPC is used to register spaces:

```javascript
// Renderer → Main
ipcRenderer.invoke('register-space', { spaceId, rootPath, name, createdAt })

// Main process handler
ipcMain.handle('register-space', async (event, { spaceId, rootPath, name, createdAt }) => {
  spaceManager.registerSpace(spaceId, rootPath, name, createdAt);
});
```

### 5. Renderer Integration

**File:** `packages/client/src/lib/comps/apps/FilesApp.svelte`

The UI components use the protocol via the exposed API:

```javascript
function getFileUrl(file: Vertex): string {
  const spaceId = (data as any).space.getId();
  const hash = file.getProperty("hash") as string;
  const mimeType = file.getProperty("mimeType") as string;
  
  if ((window as any).electronFileSystem) {
    return (window as any).electronFileSystem.getFileUrl(spaceId, hash, mimeType);
  }
  return "";
}
```

## Usage Examples

### Images
```html
<img src="sila://spaces/space-123/files/hash?type=image/jpeg" alt="Image" />
```

### Videos
```html
<video src="sila://spaces/space-123/files/hash?type=video/mp4" controls />
```

### PDFs
```html
<iframe src="sila://spaces/space-123/files/hash?type=application/pdf" />
```

## Error Handling

The protocol returns appropriate HTTP status codes:

- **400 Bad Request**: Invalid URL format or hash
- **404 Not Found**: Space or file not found
- **500 Internal Server Error**: File system errors

## Security Considerations

1. **Space Isolation**: Files are only accessible within their registered space
2. **Hash Validation**: Only valid SHA256 hashes are accepted
3. **Path Validation**: Prevents directory traversal attacks
4. **Access Control**: Files are only accessible to registered spaces

## Performance Benefits

### Before (Data URLs)
- Files loaded into memory as base64 strings
- Large files cause stack overflows
- Memory usage scales with file size
- Slow loading for large files

### After (Custom Protocol)
- Direct file system access
- No memory overhead
- Scalable to any file size
- Fast loading regardless of file size

## Debugging

### Main Process Logs
Look for logs in the Electron main process console:
```
Setting up sila file protocol...
Sila file protocol registered successfully
IPC: Registering space: space-123 /path/to/space
File protocol request: sila://spaces/space-123/files/hash
```

### Renderer Process Logs
Check the web console for:
```
Generated file URL: {spaceId, hash, mimeType, url}
Registering space: space-123 /path/to/space
```

## Future Enhancements

1. **Caching**: Browser-level caching for frequently accessed files
2. **Compression**: Automatic compression for supported file types
3. **Streaming**: Support for large video files
4. **Thumbnails**: Automatic thumbnail generation for images
5. **CDN Integration**: Support for external file storage

## Related Files

- `packages/desktop/src-electron/fileProtocol.js` - Protocol handler
- `packages/desktop/src-electron/spaceManager.js` - Space management
- `packages/desktop/src-electron/fileSystemAPI.js` - Renderer API
- `packages/desktop/src-electron/main.js` - Main process setup
- `packages/client/src/lib/comps/apps/FilesApp.svelte` - UI integration
- `packages/client/src/lib/state/clientState.svelte.ts` - Space registration
