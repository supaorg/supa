# File Previews

This document describes how file previews work across the app.

## Overview

- Messages contain lightweight file references only
- The UI resolves references to metadata and a `sila://` URL when needed
- Previews render either an image preview or a regular file tile

## Architecture

### File References
```typescript
interface FileReference {
  tree: string;    // Files AppTree ID
  vertex: string;  // File vertex ID within the tree
}
```

### Client-Side Resolution
The resolver resolves file references using the current space state:

```typescript
// Resolve a single file reference
const fileInfo = await ClientFileResolver.resolveFileReference(fileRef);

// Resolve multiple file references
const fileInfos = await ClientFileResolver.resolveFileReferences(fileRefs);
```

## Components

### FilePreview.svelte
- Takes a `FileReference`
- Resolves to `ResolvedFileInfo`
- Chooses a preview implementation based on MIME type

### ImageFilePreview.svelte
- Renders images with object-contain and viewport padding

### RegularFilePreview.svelte
- Renders an icon, filename, and friendly format label for non-images

### FileGalleryModal.svelte
- Popover-based modal for viewing the active file
- ESC and backdrop click to close
- Uses `clientState.gallery` with `open()` and `close()`

## URL Format

Files are served via the custom protocol:

```
sila://spaces/{spaceId}/files/{hash}?type={mimeType}&name={fileName}
```

## Benefits

### Performance
- **Reduced payload size**: Only send minimal reference data
- **Lazy loading**: File metadata loaded only when needed
- **Caching**: Resolved file info can be cached in client state

### Maintainability
- **Single source of truth**: File metadata comes from file vertices
- **Consistency**: All file information resolved from the same source
- **Simpler data flow**: No need to sync metadata between attachments and file vertices

### User Experience
- Fast message loading
- Consistent file information
- Clear loading and error states

## Implementation Details

### File Resolution Flow
1. Extract `FileReference` from a message
2. Load Files AppTree using space state
3. Get file vertex and metadata
4. Construct `sila://` URL with `type` and `name` query params
5. Optionally cache

### Error Handling
- Missing space/tree/vertex/hash: warn and skip
- FileStore unavailable: show error state
### Caching Strategy
- Metadata cache per session
- Tree cache in space state

## Usage Examples

### Using FilePreview
```svelte
<FilePreview fileRef={{ tree: 'files-tree-id', vertex: 'file-vertex-id' }} showGallery={true} />
```

### Migrating Existing Messages
```typescript
import { AttachmentMigration } from '@sila/client/utils/attachmentMigration';

// Check if message can be migrated
if (AttachmentMigration.canMigrateMessage(message)) {
  const migratedMessage = AttachmentMigration.migrateMessage(message);
  // Use migratedMessage with new components
}
```

## Future Enhancements

### Advanced Caching
- **IndexedDB cache**: Persistent file metadata cache
- **Preloading**: Preload file metadata for visible messages
- **Background sync**: Sync file metadata in background

### Performance Optimizations
- **Virtual scrolling**: Only render visible file previews
- **Thumbnail generation**: Generate and cache thumbnails
- **Progressive loading**: Load low-res previews first

### Enhanced Features
- File search
- File sharing
- File versioning

## Testing

### Unit Tests
- File reference resolution
- Error handling scenarios
- Migration utilities
- Type guards and conversions

### Integration Tests
- End-to-end file preview flow
- Cross-space file references
- Large file handling
- Concurrent file loading

### Performance Tests
- Memory usage with many files
- Network payload size reduction
- Loading time improvements
- Cache effectiveness

## Conclusion

File previews are lightweight, consistent, and integrated with the gallery for a clean user experience.