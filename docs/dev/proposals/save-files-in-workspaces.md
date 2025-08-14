## Save files in workspaces (content-addressed storage + Files AppTree)

Goal: Introduce a durable, content-addressed file store for binary assets (images, PDFs, etc.) inside each workspace, referenced from app trees. Desktop (FileSystem) only for Phase 1; browser/IndexedDB will remain in-memory for assets for now.

### Scope (Phase 1)
- Store files on disk for desktop workspaces only (Electron). No IDB persistence yet.
- Content-addressed layout using a cryptographic hash (sha256).
- References to files are stored in app trees (e.g., message attachments) as `fileId = sha256:HASH` plus metadata.
- UI can render thumbnails by loading from disk on demand (create a data URL at read time) and caching transiently.

### Directory layout (bytes on disk)
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

### Files AppTree (metadata, logical folders)
Create a dedicated `AppTree` whose `appId` is a UUID like any other app tree. Mark it as a files tree with a root property (e.g., `appKind: 'files'` or `filesTree: true`). It’s a logical, browsable view; bytes live in CAS on disk.

Default structure (date-based):
```
files/
  2025/
    08/
      14/
        cat.jpg    (vertex)
```

Vertex types:
- Folder vertex
  - `_n: "folder"`, `name: string`, `createdAt: number`
- File vertex
  - `_n: "file"`, `name: string`
  - `contentId: "sha256:<hex>"` (points to bytes in CAS)
  - `mimeType?: string`, `size?: number`
  - `width?: number`, `height?: number` (images), `alt?: string`, `tags?: string[]`
  - `createdAt: number`

Helper: Files tree creation

We can provide a small helper in core (future code) to create and initialize a files app tree.

```ts
// Pseudocode/spec – implementation to be added later
export class FilesTreeData {
  static createNewFilesTree(space: Space): AppTree {
    const appId = crypto.randomUUID(); // or uuid()
    const tree = space.newAppTree(appId);
    const root = tree.tree.root!;
    // Mark as files tree
    root.setProperty('appKind', 'files');
    // Logical root folder
    tree.tree.newNamedVertex(root.id, 'files');
    return tree;
  }

  static ensureFolderPath(filesTree: AppTree, segments: string[]): Vertex {
    // Walk/create folder vertices under 'files'
  }

  static createOrLinkFile(params: {
    filesTree: AppTree;
    parentFolder: Vertex;
    name: string;
    contentId: string; // sha256:...
    mimeType?: string;
    size?: number;
    width?: number;
    height?: number;
  }): Vertex {
    // Create a file vertex under parent with provided metadata
  }
}
```

### Referencing files from messages
Messages don’t embed blobs. They reference file vertices:

```ts
type FileRef = { tree: string; vertex: string }; // { filesTreeId, fileVertexId }

type MessageAttachmentRef = {
  id: string;
  kind: 'image' | 'file';
  file: FileRef;              // JSON ref to Files AppTree
  name?: string;              // shown label; can differ from vertex.name if needed
  alt?: string;
};
```

The file vertex contains `contentId` (sha256) to resolve CAS bytes. For instant previews, we may also set a transient `attachmentsDataUrl[]` on the message; persistence filters transients.

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
   - `fileId = fileStore.putDataUrl(dataUrl)` (compute sha256 and store in CAS)
   - Ensure Files AppTree exists; ensure folder path `files/YYYY/MM/DD`
   - Create a `file` vertex with `name`, `contentId = fileId`, `mimeType`, `size`, `width/height`, `createdAt`
   - Set message `attachments` to `MessageAttachmentRef[]` with `{ file: { tree: filesTreeId, vertex: fileVertexId } }`
   - Optionally keep transient `attachmentsDataUrl[]` for immediate display

### Read flow
- For message rendering:
  - If transient `attachmentsDataUrl` exists, use it.
  - Else resolve `fileRef` → load file vertex → get `contentId` → `fileStore.getDataUrl(contentId)` and cache transiently.
- For agent/model input:
  - Resolve `fileRef` to `contentId`, read bytes or data URL, and send as AIWrapper `LangContentPart` with `{ type: 'image', image: { kind: 'base64', ... } }`.

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
- Files AppTree helpers: `ensureFilesTree`, `ensureFolderPath`, `createOrLinkFile`.
- Chat attachments: store `attachments` as JSON refs `{ file: { tree, vertex } }`; keep transient data URLs for previews.
- UI: lazy-load previews from `fileRef` via Files AppTree → CAS.

### Out of scope (Phase 1)
- Browser/IndexedDB file persistence.
- Connectors/remote sync of file bytes.

### Future work
- IndexedDB/Blobs-backed file store for web/mobile.
- Remote sync and partial downloads.
- Background thumbnail generation and caching.


