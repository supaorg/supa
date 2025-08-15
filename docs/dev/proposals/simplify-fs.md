# Simplify File System Design

## Current System Analysis

The current file system design has unnecessary complexity with the `fileId` concept:

1. **FileStore API** returns `{ fileId: string; hash: string; ... }` where `fileId = "sha256:" + hash`
2. **File vertices** store `contentId: "sha256:<hex>"` which is just the fileId
3. **Path derivation** requires parsing `fileId` to extract the hash: `pathFromFileId()` and `makeBytesPath()`
4. **Multiple layers** of indirection: hash → fileId → contentId → file vertex

## Proposed Simplification

### Core Changes

1. **Remove `fileId` concept entirely**
   - FileStore methods work directly with hash strings
   - No more `sha256:` prefix needed
   - Hash is the direct identifier for files

2. **Simplify FileStore API**
   ```ts
   export interface FileStore {
     putDataUrl(dataUrl: string): Promise<{ hash: string; mimeType?: string; size: number }>;
     putBytes(bytes: Uint8Array, mimeType?: string): Promise<{ hash: string; size: number }>;
     exists(hash: string): Promise<boolean>;
     getBytes(hash: string): Promise<Uint8Array>;
     getDataUrl(hash: string): Promise<string>;
     delete(hash: string): Promise<void>;
   }
   ```

3. **Simplify file vertex properties**
   - Replace `contentId: "sha256:<hex>"` with `hash: "<hex>"`
   - Direct hash reference without prefix

4. **Simplify path derivation**
   - `makeBytesPath(hash: string)` directly uses hash
   - No need for `pathFromFileId()` function
   - Path format: `{hash[0..1]}/{hash[2..]}.bin`

### Benefits

1. **Reduced complexity**: One less layer of indirection
2. **Cleaner API**: No need to parse/construct fileId strings
3. **More intuitive**: Hash is the natural identifier for content-addressed storage
4. **Less code**: Fewer helper functions and string manipulations
5. **Better performance**: No string parsing overhead

### Implementation Changes

#### FileStore.ts
- Remove `fileId` from all return types
- Remove `pathFromFileId()` function
- Simplify `makeBytesPath()` to take hash directly
- Update all methods to work with hash strings

#### FilesTreeData.ts
- Change `createOrLinkFile()` to accept `hash` instead of `contentId`
- Update file vertex creation to use `hash` property
- Update deduplication logic to check `hash` instead of `contentId`

#### ChatAppData.ts
- Update attachment handling to work with hash directly
- Remove fileId construction/parsing
- Simplify file vertex creation calls

#### Tests
- Update all test files to use hash instead of fileId
- Remove fileId-related assertions
- Update path verification logic

### Migration Strategy

Since this is still in development (Phase 1), we can make this change without migration concerns:

1. Update FileStore interface and implementation
2. Update FilesTreeData API
3. Update all calling code (ChatAppData, tests)
4. Remove unused helper functions
5. Update documentation

### On-disk Layout (Updated)

The file system layout changes to use hash directly as filename:

```
<spaceRoot>/
  space-v1/
    files/
      sha256/
        ab/
          cdef...89.bin  # {hash[0..1]}/{hash[2..]}.bin (same structure, cleaner naming)
```

**Current system**: Uses `fileId = "sha256:<hash>"` as the identifier, then extracts hash for path
**Proposed system**: Uses `hash` directly as the identifier and filename

The path structure remains the same (`{hash[0..1]}/{hash[2..]}.bin`) but the naming is cleaner and more direct.

### File Vertex Properties (Updated)

```ts
// Before
{
  _n: "file",
  name: "image.png",
  contentId: "sha256:abcdef123456...",
  mimeType: "image/png",
  size: 1024
}

// After
{
  _n: "file", 
  name: "image.png",
  hash: "abcdef123456...",
  mimeType: "image/png", 
  size: 1024
}
```

### Message Attachment References (Unchanged)

Message attachments still reference file vertices by tree/vertex ID:
```ts
{
  id: "att1",
  kind: "image",
  name: "screenshot.png",
  file: { tree: "files-tree-id", vertex: "file-vertex-id" }
}
```

The file vertex contains the hash, which is used to load the actual bytes from CAS.

## Hash Collision Considerations

### SHA-256 Collision Probability

SHA-256 produces 256-bit (32-byte) hashes, giving 2^256 possible values. The probability of collision is extremely low:

- **Birthday paradox**: With 2^128 files, collision probability is ~50%
- **Realistic usage**: Even with millions of files, collision probability is negligible
- **Cryptographic strength**: SHA-256 is designed to be collision-resistant

### Alternative Hash Algorithms

While SHA-256 is sufficient for most use cases, we could consider:

1. **SHA-512**: 512-bit hash, even lower collision probability
2. **BLAKE3**: Faster than SHA-256, 256-bit default output
3. **Future-proofing**: Could add hash algorithm versioning if needed

### Recommendation

**Stick with SHA-256** for now because:
- Collision probability is astronomically low for realistic file counts
- SHA-256 is widely supported and well-tested
- 256-bit hashes provide excellent security margin
- Can always upgrade later if needed

If we want to be extra cautious, we could add a hash algorithm identifier to the system:
```ts
// Future consideration
{
  hash: "abcdef123456...",
  hashAlgo: "sha256" // or "sha512", "blake3", etc.
}
```

## Conclusion

This simplification removes unnecessary abstraction while maintaining all functionality. The hash becomes the direct identifier for files, making the system more intuitive and efficient. Since we're still in Phase 1 development, this change can be made cleanly without migration concerns.

The file naming becomes cleaner (using hash directly instead of `sha256:<hash>`) and SHA-256 provides sufficient collision resistance for all practical purposes.
