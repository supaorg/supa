# Simplified File Previews in Chat

This document describes the new simplified file preview system that replaces the current attachment-based approach with a more efficient file reference system.

## Overview

The current file preview system sends complete attachment objects containing all file metadata (name, size, mimeType, dataUrl, etc.) along with file references. This creates redundancy and increases payload size.

The new system simplifies this by:
1. **Sending only file references**: `{ tree: filesTreeId, vertex: fileVertexId }`
2. **Resolving metadata in the UI**: Using the client state to load file information on-demand
3. **Single source of truth**: All file metadata comes from the actual file vertices in the Files AppTree

## Architecture

### File References
```typescript
interface FileReference {
  tree: string;    // Files AppTree ID
  vertex: string;  // File vertex ID within the tree
}
```

### Simple Attachments
```typescript
interface SimpleAttachment {
  id: string;
  kind: 'image' | 'text' | 'video' | 'pdf' | 'file';
  file: FileReference;
  alt?: string; // Optional alt text for accessibility
}
```

### Client-Side Resolution
The `ClientFileResolver` utility resolves file references using the current space state:

```typescript
// Resolve a single file reference
const fileInfo = await ClientFileResolver.resolveFileReference(fileRef);

// Resolve multiple file references
const fileInfos = await ClientFileResolver.resolveFileReferences(fileRefs);
```

## Components

### FileReferencePreview.svelte
A new preview component that:
- Takes a `FileReference` as input
- Resolves the file using `ClientFileResolver`
- Renders the appropriate preview component
- Handles loading and error states

### ChatAppMessageSimple.svelte
A new chat message component that:
- Extracts simple attachments from messages
- Uses `FileReferencePreview` for each attachment
- Provides a cleaner, more efficient rendering pipeline

## Migration Strategy

### Backward Compatibility
The system maintains backward compatibility through:

1. **Type Guards**: `isSimpleAttachment()` and `isLegacyAttachment()` functions
2. **Conversion Utilities**: `toSimpleAttachment()` and `toLegacyAttachment()` functions
3. **Migration Helper**: `AttachmentMigration` class for bulk conversions

### Gradual Migration
1. **Phase 1**: Deploy new components alongside existing ones
2. **Phase 2**: Update new messages to use simple attachments
3. **Phase 3**: Migrate existing messages (optional)
4. **Phase 4**: Remove legacy components

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
- **Faster message loading**: Smaller payloads
- **Consistent file information**: Always up-to-date metadata
- **Better error handling**: Clear loading and error states

## Implementation Details

### File Resolution Flow
1. **Extract file reference** from attachment
2. **Load Files AppTree** using space state
3. **Get file vertex** and extract metadata
4. **Load bytes from CAS** using FileStore
5. **Convert to data URL** for preview
6. **Cache result** for future use

### Error Handling
- **Missing space**: Graceful fallback with warning
- **Missing tree**: Log warning and skip file
- **Missing vertex**: Log warning and skip file
- **Missing hash**: Log warning and skip file
- **FileStore unavailable**: Show error state
- **Network errors**: Retry with exponential backoff

### Caching Strategy
- **Metadata cache**: File metadata cached per session
- **Data URL cache**: Resolved data URLs cached with TTL
- **Tree cache**: Files AppTree instances cached in space state

## Usage Examples

### Creating Simple Attachments
```typescript
import { AttachmentMigration } from '@sila/client/utils/attachmentMigration';

const simpleAttachment = AttachmentMigration.createSimpleAttachment(
  'att1',
  'image',
  { tree: 'files-tree-id', vertex: 'file-vertex-id' },
  'Screenshot of the dashboard'
);
```

### Using FileReferencePreview
```svelte
<script>
  import FileReferencePreview from '@sila/client/comps/files/FileReferencePreview.svelte';
  
  const fileRef = { tree: 'files-tree-id', vertex: 'file-vertex-id' };
</script>

<FileReferencePreview 
  fileRef={fileRef}
  showGallery={true}
  onGalleryOpen={() => openGallery()}
/>
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
- **File search**: Search within file content
- **File sharing**: Share files between spaces
- **File versioning**: Track file changes over time

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

The simplified file preview system provides a more efficient, maintainable, and user-friendly approach to handling file attachments in chat. By leveraging the existing space state and file infrastructure, it reduces complexity while improving performance and consistency.