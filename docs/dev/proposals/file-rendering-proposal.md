# File Rendering Proposal for Sila Electron App

## Executive Summary

This proposal outlines a comprehensive solution for rendering files (images, PDFs, videos, etc.) directly from Sila's Content-Addressed Storage (CAS) system in the Electron app. The solution will replace the current inefficient data URL approach with a robust, scalable file serving system.

## Current State Analysis

### Existing Infrastructure
- **Electron Setup**: Uses `electron-serve` for static file serving, context isolation enabled
- **CAS Structure**: Files stored at `{spaceRoot}/space-v1/files/sha256/{prefix}/{rest}`
- **File System**: ElectronFs wrapper with full file system access
- **Current Issue**: Loading files as data URLs causes memory issues and stack overflows

### File Types to Support
1. **Images**: PNG, JPEG, GIF, WebP, SVG, AVIF
2. **Documents**: PDF, TXT, Markdown
3. **Videos**: MP4, WebM, OGV
4. **Audio**: MP3, WAV, OGG
5. **Archives**: ZIP, RAR (view contents)

## Proposed Solution: Custom Protocol + HTTP Server Hybrid

### Option 1: Custom Protocol (Primary Recommendation)

#### Implementation
```javascript
// src-electron/fileProtocol.js
import { protocol } from 'electron';
import path from 'path';
import fs from 'fs/promises';

export function setupFileProtocol() {
  protocol.registerFileProtocol('sila', async (request, callback) => {
    try {
      const url = new URL(request.url);
      // sila://spaces/{spaceId}/files/{hash}?type={mimeType}
      const pathParts = url.pathname.split('/').filter(Boolean);
      
      if (pathParts.length !== 4 || pathParts[0] !== 'spaces' || pathParts[2] !== 'files') {
        callback({ error: 400, errorDescription: 'Invalid URL format' });
        return;
      }
      
      const spaceId = pathParts[1];
      const hash = pathParts[3];
      const mimeType = url.searchParams.get('type');
      
      // Validate hash format
      if (!/^[a-f0-9]{64}$/.test(hash)) {
        callback({ error: 400, errorDescription: 'Invalid hash format' });
        return;
      }
      
      // Get space root path
      const spaceRoot = await getSpaceRootPath(spaceId);
      if (!spaceRoot) {
        callback({ error: 404, errorDescription: 'Space not found' });
        return;
      }
      
      const filePath = makeBytesPath(spaceRoot, hash);
      
      // Check if file exists
      if (!await fs.access(filePath).then(() => true).catch(() => false)) {
        callback({ error: 404, errorDescription: 'File not found' });
        return;
      }
      
      callback({ 
        path: filePath,
        headers: mimeType ? { 'Content-Type': mimeType } : undefined
      });
    } catch (error) {
      console.error('File protocol error:', error);
      callback({ error: 500 });
    }
  });
}

function makeBytesPath(spaceRoot, hash) {
  const prefix = hash.slice(0, 2);
  const rest = hash.slice(2);
  return path.join(spaceRoot, 'space-v1', 'files', 'sha256', prefix, rest);
}
```

#### Usage in UI
```html
<!-- Images -->
<img src="sila://spaces/space-123/files/c8670ca7ac518d8350206e897e61488210d3dcf963828ea8b90d23d3f8e04d08?type=image/jpeg" />

<!-- Videos -->
<video src="sila://spaces/space-123/files/hash?type=video/mp4" controls />

<!-- PDFs -->
<iframe src="sila://spaces/space-123/files/hash?type=application/pdf" />
```

### Option 2: Local HTTP Server (Fallback)

#### Implementation
```javascript
// src-electron/fileServer.js
import express from 'express';
import path from 'path';
import { createServer } from 'http';

export class FileServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.port = null;
  }
  
  async start() {
    this.app.get('/files/:hash', async (req, res) => {
      try {
        const { hash } = req.params;
        const mimeType = req.query.type;
        const spaceRoot = getCurrentSpaceRoot();
        const filePath = makeBytesPath(spaceRoot, hash);
        
        if (!await fs.access(filePath).then(() => true).catch(() => false)) {
          res.status(404).send('File not found');
          return;
        }
        
        if (mimeType) {
          res.setHeader('Content-Type', mimeType);
        }
        
        res.sendFile(filePath);
      } catch (error) {
        res.status(500).send('Internal server error');
      }
    });
    
    this.server = createServer(this.app);
    this.server.listen(0, () => {
      this.port = this.server.address().port;
    });
  }
  
  getFileUrl(hash, mimeType) {
    return `http://localhost:${this.port}/files/${hash}${mimeType ? `?type=${mimeType}` : ''}`;
  }
}
```

## Technical Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

#### 1.1 Protocol Registration
- [ ] Create `src-electron/fileProtocol.js`
- [ ] Register custom protocol in `main.js`
- [ ] Add protocol security validation
- [ ] Implement error handling and logging

#### 1.2 Space Integration
- [ ] Create space manager to track current space
- [ ] Add space root path resolution
- [ ] Implement space switching support
- [ ] Add space validation

#### 1.3 File Path Resolution
- [ ] Implement `makeBytesPath` utility
- [ ] Add file existence checking
- [ ] Add MIME type detection
- [ ] Implement caching layer

### Phase 2: File Type Support (Week 2)

#### 2.1 Image Rendering
- [ ] Update FilesApp to use protocol URLs
- [ ] Add image preview components
- [ ] Implement lazy loading
- [ ] Add image metadata display

#### 2.2 Document Rendering
- [ ] PDF viewer integration
- [ ] Text file viewer
- [ ] Markdown renderer
- [ ] Document metadata

#### 2.3 Media Rendering
- [ ] Video player component
- [ ] Audio player component
- [ ] Media controls
- [ ] Thumbnail generation

### Phase 3: Advanced Features (Week 3)

#### 3.1 Performance Optimization
- [ ] Implement file caching
- [ ] Add compression support
- [ ] Optimize for large files
- [ ] Add progress indicators

#### 3.2 Security Enhancements
- [ ] Add file access validation
- [ ] Implement rate limiting
- [ ] Add content security policies
- [ ] Validate file types

#### 3.3 User Experience
- [ ] Add file preview modals
- [ ] Implement drag and drop
- [ ] Add keyboard shortcuts
- [ ] Create file viewer tabs

## File Structure Changes

```
packages/desktop/
├── src-electron/
│   ├── fileProtocol.js          # Custom protocol implementation
│   ├── fileServer.js            # HTTP server fallback
│   ├── spaceManager.js          # Space tracking and management
│   ├── main.js                  # Updated with protocol registration
│   └── preload.js               # Updated with file access APIs
├── src/
│   └── lib/
│       └── components/
│           ├── FileViewer.svelte    # Generic file viewer
│           ├── ImageViewer.svelte   # Image-specific viewer
│           ├── PDFViewer.svelte     # PDF viewer
│           ├── VideoViewer.svelte   # Video player
│           └── AudioViewer.svelte   # Audio player
```

## API Design

### Protocol URLs
```
sila://spaces/{spaceId}/files/{hash}?type={mimeType}
```

### Preload API
```javascript
// Exposed to renderer
window.electronFileSystem = {
  getFileUrl: (spaceId, hash, mimeType) => string,
  getFileInfo: (spaceId, hash) => Promise<FileInfo>,
  getFilePreview: (spaceId, hash) => Promise<PreviewData>,
  openFile: (spaceId, hash) => Promise<void>
};
```

### File Info Interface
```typescript
interface FileInfo {
  hash: string;
  name: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  createdAt: Date;
}
```

## Security Considerations

### Protocol Security
- Validate hash format (64 character hex string)
- Restrict to specific space directories
- Implement rate limiting
- Add content type validation

### File Access Control
- Validate file ownership
- Check space permissions
- Implement file size limits
- Add malicious file detection

### Content Security
- Sanitize file content
- Validate MIME types
- Implement sandboxing for PDFs
- Add virus scanning hooks

## Performance Considerations

### Caching Strategy
- Browser-level caching for static files
- Memory caching for frequently accessed files
- Disk caching for large files
- Cache invalidation on space changes

### Memory Management
- Stream large files instead of loading entirely
- Implement file size limits
- Add memory usage monitoring
- Garbage collection optimization

### Network Optimization
- Compression for text files
- Progressive loading for images
- Chunked transfer for videos
- CDN-like caching

## Testing Strategy

### Unit Tests
- Protocol URL parsing
- File path resolution
- MIME type detection
- Error handling

### Integration Tests
- Protocol registration
- File serving
- Space switching
- Error scenarios

### Performance Tests
- Large file handling
- Concurrent access
- Memory usage
- Response times

### Security Tests
- Malicious URL handling
- File access validation
- Content type spoofing
- Rate limiting

## Migration Plan

### Phase 1: Parallel Implementation
- Keep existing data URL system
- Implement new protocol system
- Add feature flag for switching

### Phase 2: Gradual Migration
- Update FilesApp to use new system
- Migrate chat attachments
- Update file previews

### Phase 3: Cleanup
- Remove data URL code
- Clean up unused dependencies
- Update documentation

## Success Metrics

### Performance
- File load time < 100ms for images
- Memory usage reduction by 50%
- No more stack overflow errors
- Support for files > 100MB

### User Experience
- Seamless file previews
- No loading spinners for small files
- Responsive file navigation
- Intuitive file viewer interface

### Technical
- 100% test coverage for new code
- Zero security vulnerabilities
- Backward compatibility maintained
- Documentation complete

## Risk Assessment

### High Risk
- **Protocol conflicts**: Mitigation - Use unique protocol name
- **Security vulnerabilities**: Mitigation - Comprehensive security review
- **Performance regressions**: Mitigation - Extensive testing

### Medium Risk
- **File system permissions**: Mitigation - Proper error handling
- **Cross-platform compatibility**: Mitigation - Test on all platforms
- **User data loss**: Mitigation - Backup and validation

### Low Risk
- **UI/UX issues**: Mitigation - User testing
- **Documentation gaps**: Mitigation - Comprehensive docs

## Conclusion

This proposal provides a robust, scalable solution for file rendering in Sila's Electron app. The custom protocol approach offers the best balance of performance, security, and user experience. The phased implementation ensures minimal disruption while delivering significant improvements.

The solution addresses the current technical debt while providing a foundation for future file-related features. It maintains backward compatibility while enabling new capabilities like large file support, better performance, and enhanced security.

## Next Steps

1. **Review and approval** of this proposal
2. **Technical design review** with the team
3. **Implementation planning** and resource allocation
4. **Development** following the phased approach
5. **Testing and validation** at each phase
6. **Deployment and monitoring** of the new system
