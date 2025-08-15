# Simplify File System Design

**Status: ✅ IMPLEMENTED**

This proposal has been fully implemented. The file system uses hash strings directly for content-addressed storage.

## Design Overview

The file system design uses a clean, direct approach to content-addressed storage:

1. **FileStore API** works directly with hash strings
2. **File vertices** store `hash: "<hex>"` for direct reference
3. **Path derivation** uses hash directly: `{hash[0..1]}/{hash[2..]}`
4. **Simple indirection**: hash → file vertex → CAS storage

## Implemented Simplification

### Current Implementation

1. **Direct hash-based storage**
   - FileStore methods work directly with hash strings
   - Hash is the natural identifier for content-addressed storage
   - Clean and intuitive API design

2. **FileStore API**
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

3. **File vertex properties**
   - Uses `hash: "<hex>"` for direct reference
   - Clean metadata storage without unnecessary prefixes

4. **Path derivation**
   - `makeBytesPath(hash: string)` uses hash directly
   - Path format: `{hash[0..1]}/{hash[2..]}`

### Benefits

1. **Clean design**: Direct hash-based addressing without unnecessary abstraction
2. **Intuitive API**: Hash is the natural identifier for content-addressed storage
3. **Efficient**: No string parsing overhead or complex indirection
4. **Maintainable**: Simpler codebase with fewer helper functions
5. **Performance**: Direct operations without intermediate string manipulations

### Implementation Details

#### FileStore.ts
- Works directly with hash strings
- `makeBytesPath()` takes hash directly
- All methods use hash as the primary identifier

#### FilesTreeData.ts
- `createOrLinkFile()` accepts `hash` parameter
- File vertices use `hash` property for storage
- Deduplication logic checks `hash` values

#### ChatAppData.ts
- Attachment handling works with hash directly
- File vertex creation uses hash parameter
- Clean integration with FileStore API

#### Tests
- All test files use hash-based operations
- Path verification uses hash directly
- Comprehensive coverage of file operations

### Development Status

This implementation was completed during Phase 1 development:

1. FileStore interface and implementation updated
2. FilesTreeData API simplified
3. All calling code (ChatAppData, tests) updated
4. Documentation reflects current design
5. Comprehensive test coverage in place

### On-disk Layout

The file system layout uses hash directly as filename:

```
<spaceRoot>/
  space-v1/
    files/
      sha256/
        ab/
          cdef...89      # {hash[0..1]}/{hash[2..]}
```

The path structure uses `{hash[0..1]}/{hash[2..]}` for efficient directory distribution and clean naming.

### File Vertex Properties

```ts
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

This design provides a clean, direct approach to content-addressed storage. The hash serves as the natural identifier for files, making the system intuitive and efficient. SHA-256 provides excellent collision resistance for all practical purposes.

The implementation is complete and fully tested, with comprehensive documentation and test coverage in place.
