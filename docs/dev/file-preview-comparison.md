# File Preview System Comparison

This document compares the current file preview system with the proposed simplified system.

## Current System

### Attachment Structure
```typescript
// Current attachment format - contains redundant data
interface CurrentAttachment {
  id: string;
  kind: string;
  name?: string;
  alt?: string;
  dataUrl?: string;        // Transient data for immediate preview
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  file?: {                 // File reference (tree + vertex)
    tree: string;
    vertex: string;
  };
  content?: string;        // For text files
}
```

### Data Flow
1. **Message Creation**: File uploaded → stored in CAS → file vertex created → attachment with both file reference AND transient data
2. **Message Storage**: Attachment stored with redundant metadata
3. **Message Loading**: Full attachment object loaded with all metadata
4. **UI Rendering**: Uses transient dataUrl for immediate preview

### Issues
- **Redundant Data**: File metadata stored in both file vertex and attachment
- **Large Payloads**: Attachments contain full metadata + dataUrl
- **Sync Issues**: Metadata can become inconsistent between file vertex and attachment
- **Complex Logic**: Need to handle both transient data and file references

## Proposed Simplified System

### Attachment Structure
```typescript
// Simplified attachment format - only essential data
interface SimpleAttachment {
  id: string;
  kind: 'image' | 'text' | 'video' | 'pdf' | 'file';
  file: {                  // Only file reference needed
    tree: string;
    vertex: string;
  };
  alt?: string;            // Optional accessibility text
}
```

### Data Flow
1. **Message Creation**: File uploaded → stored in CAS → file vertex created → simple attachment with only file reference
2. **Message Storage**: Only file reference stored
3. **Message Loading**: Minimal attachment data loaded
4. **UI Rendering**: File reference resolved on-demand using client state

### Benefits
- **Minimal Payload**: Only essential reference data
- **Single Source of Truth**: All metadata comes from file vertices
- **Consistency**: No sync issues between attachment and file metadata
- **Simpler Logic**: Only need to handle file references

## Detailed Comparison

### Payload Size Reduction

**Current System**:
```json
{
  "attachments": [
    {
      "id": "att1",
      "kind": "image",
      "name": "screenshot.png",
      "mimeType": "image/png",
      "size": 245760,
      "width": 1920,
      "height": 1080,
      "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMBg9v2e0UAAAAASUVORK5CYII=",
      "file": {
        "tree": "files-tree-123",
        "vertex": "file-vertex-456"
      }
    }
  ]
}
```
**Size**: ~245KB (mostly base64 data)

**Simplified System**:
```json
{
  "attachments": [
    {
      "id": "att1",
      "kind": "image",
      "file": {
        "tree": "files-tree-123",
        "vertex": "file-vertex-456"
      },
      "alt": "Screenshot of dashboard"
    }
  ]
}
```
**Size**: ~150 bytes (99.9% reduction)

### Memory Usage

**Current System**:
- Each message with attachments stores full metadata in memory
- Base64 data URLs consume significant memory
- Redundant metadata stored multiple times

**Simplified System**:
- Only file references stored in memory
- File metadata loaded on-demand and cached
- Shared metadata across multiple references to same file

### Performance Impact

**Current System**:
- **Message Loading**: Load full attachment data immediately
- **Memory**: High memory usage per message
- **Network**: Large payloads for messages with files
- **Rendering**: Immediate preview (pro)

**Simplified System**:
- **Message Loading**: Load minimal reference data
- **Memory**: Low memory usage per message
- **Network**: Minimal payloads
- **Rendering**: Lazy loading with loading states (con)

### Error Handling

**Current System**:
- If transient dataUrl is missing, fall back to file reference resolution
- Complex fallback logic
- Inconsistent error states

**Simplified System**:
- Single resolution path
- Clear loading and error states
- Consistent error handling

### Caching Strategy

**Current System**:
- No caching of resolved file data
- Each message loads its own copy of metadata
- Redundant network requests

**Simplified System**:
- File metadata cached per session
- Data URLs cached with TTL
- Shared cache across messages

## Migration Strategy

### Phase 1: Parallel Implementation
- Deploy new components alongside existing ones
- Add feature flag to switch between systems
- Monitor performance and user feedback

### Phase 2: New Messages
- Update message creation to use simple attachments
- Keep backward compatibility for existing messages
- Gradual migration of new content

### Phase 3: Existing Messages (Optional)
- Migrate existing messages to simple format
- Batch migration process
- Rollback capability

### Phase 4: Cleanup
- Remove legacy components
- Clean up unused code
- Update documentation

## Implementation Considerations

### Backward Compatibility
- Type guards to detect attachment format
- Conversion utilities for migration
- Graceful fallback for legacy messages

### Performance Monitoring
- Track payload size reduction
- Monitor loading times
- Measure memory usage improvements

### User Experience
- Loading states for file resolution
- Error handling for missing files
- Progressive enhancement

## Conclusion

The simplified file preview system provides significant benefits:

1. **99.9% payload size reduction** for messages with file attachments
2. **Single source of truth** for file metadata
3. **Simplified data flow** and reduced complexity
4. **Better caching** and performance optimization opportunities
5. **Consistent error handling** and user experience

The trade-off is slightly delayed file previews (loading states vs immediate preview), but this is outweighed by the substantial performance and maintainability improvements.