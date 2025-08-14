## Save files in workspaces (content-addressed storage)

Goal: Introduce a durable, content-addressed file store for binary assets (images, PDFs, etc.) inside each workspace, referenced from app trees. Desktop (FileSystem) only for Phase 1; browser/IndexedDB will remain in-memory for assets for now.

### Scope (Phase 1)
- Store files on disk for desktop workspaces only (Electron). No IDB persistence yet.
- Content-addressed layout using a cryptographic hash (sha256).
- References to files are stored in app trees (e.g., message attachments) as `fileId = sha256:HASH` plus metadata.
- UI can render thumbnails by loading from disk on demand (create a data URL at read time) and caching transiently.

### Directory layout
Under the workspace path used by `FileSystemPersistenceLayer`:

```
<spaceRoot>/
  space-v1/
    ops/                 # existing ops storage (jsonl)
    files/               # NEW: binary assets store
      sha256/            # algorithm namespace
        ab/              # first 2 hex chars of the hash
          cdef...89.bin  # remaining hex chars of the hash
    secrets               # existing secrets file
```

Notes:
- We use `sha256/<first2>/<rest>` fan-out to avoid too many files in a single directory.
- Extension `.bin` is optional. We can omit it, as the MIME type is stored in metadata.
- The file’s full ID is `sha256:HASH` (lowercase hex). Path can be derived from ID.

### Referencing files from app trees
We do not write blobs into the tree. Instead, we store references plus metadata. Example (message attachment):

```ts
export type MessageAttachmentRef = {
  id: string;                  // attachment instance id (uuid)
  kind: 'image' | 'file';
  fileId: string;              // content id, e.g. 'sha256:abcdef...'
  name?: string;               // original filename
  mimeType?: string;
  size?: number;               // bytes
  width?: number;              // images only
  height?: number;             // images only
  alt?: string;                // optional alt text
};
```

During message creation (or later background persist), we convert in-memory attachments (data URLs) into `MessageAttachmentRef`s and set them on the message (non-transient). For immediate UI rendering, we may also set a transient `attachmentsDataUrl` property on the vertex with data URLs for quick preview; persistence filters out transients.

### FileStore API (core)
Introduce a small API in `@sila/core` to read/write files in a workspace when a `FileSystemPersistenceLayer` is present.

```ts
export interface FileStore {
  putDataUrl(dataUrl: string): Promise<{ fileId: string; hash: string; mimeType?: string; size: number }>;
  putBytes(bytes: Uint8Array, mimeType?: string): Promise<{ fileId: string; hash: string; size: number }>;
  exists(fileId: string): Promise<boolean>;
  getBytes(fileId: string): Promise<Uint8Array>;            // for processing
  getDataUrl(fileId: string): Promise<string>;               // for previews
  delete(fileId: string): Promise<void>;
}
```

Implementation notes:
- Hashing: compute sha256 over the raw bytes. Return `{ fileId: 'sha256:' + hex }`.
- Path derivation: `files/sha256/<hash[0..1]>/<hash[2..]>`.
- Deduplication: if file path exists, skip writing. Return existing `fileId`.
- MIME detection: rely on provided `mimeType` or derive via simple sniffing (optional for Phase 1).
- Reads: `getDataUrl` builds `data:<mime>;base64,...` from bytes for easy UI use.

### Desktop-only (Phase 1)
- `FileSystemPersistenceLayer` will provide access to the workspace root path and the `AppFileSystem` API supports binary writes via `create/open` with `Uint8Array`.
- We need a binary read method. Options:
  - Add `readBinaryFile(path: string): Promise<Uint8Array>` to `AppFileSystem`, or
  - Reuse `open` to read (requires extending interface). For simplicity, add `readBinaryFile` in Phase 1 (desktop only implementation).
- `IndexedDBPersistenceLayer` does not implement `FileStore` in Phase 1; the UI will keep attachments in-memory.

### Write flow
1) User attaches images → UI keeps data URLs for previews.
2) When persisting (on send or in background), if desktop file store available:
   - Convert each data URL to bytes
   - `fileId = fileStore.putDataUrl(dataUrl)`
   - Replace `attachments` on the message with `MessageAttachmentRef[]` (non-transient)
   - Optionally keep a transient `attachmentsDataUrl[]` for immediate display until `getDataUrl(fileId)` lazy loads them later.

### Read flow
- For message rendering:
  - If transient `attachmentsDataUrl` exists, use it.
  - Else call `fileStore.getDataUrl(fileId)` and cache the result transiently for the session.

### Persistence interaction
- `FileSystemPersistenceLayer.saveTreeOps` already filters `transient` property ops. We will mark UI caches (e.g., `attachmentsDataUrl`) as transient.
- File bytes are never part of ops; only references are stored in the app tree.

### Garbage collection
- Default: never delete. Files are content-addressed and deduplicated. A future maintenance task can scan the tree for live `fileId`s and reclaim unreferenced files.

### Security and privacy
- Consider stripping EXIF/location metadata on write for images (optional Phase 2).
- Secrets remain in `space-v1/secrets`; no changes.

### Errors and limits
- Max size per file (e.g., 25MB) enforced at write time.
- If disk write fails, keep attachment in-memory and mark reference absent.

### Minimal changes
- Core: add `FileStore` and a `createFileStore(space: Space): FileStore | null` helper for desktop.
- App FS: add `readBinaryFile(path: string): Promise<Uint8Array>` desktop implementation.
- Chat attachments: switch from `dataUrl` to `{ fileId, ... }` when file store is available.
- UI: lazy-load previews from `fileId` when needed.

### Out of scope (Phase 1)
- Browser/IndexedDB file persistence.
- Connectors/remote sync of file bytes.

### Future work
- IndexedDB/Blobs-backed file store for web/mobile.
- Remote sync and partial downloads.
- Background thumbnail generation and caching.


