## Files in Spaces (Phase 1)

This document outlines how Sila persists binary files (images and other assets) inside a workspace and how applications reference them. Phase 1 covers desktop (Electron/Node) using the File System; web/IDB persistence for blobs is out of scope.

### Goals
- Durable content-addressed storage (CAS) for binary assets per workspace
- Logical file browsing and metadata via a dedicated Files AppTree
- App messages reference files by ID; blobs are never embedded in CRDT ops

### On-disk layout
All bytes live under the workspace path used by `FileSystemPersistenceLayer`:

```
<spaceRoot>/
  space-v1/
    ops/                 # CRDT ops (jsonl, existing)
    files/
      sha256/
        ab/
          cdef...89      # full hash split as 2+rest, binary content
    secrets              # encrypted secrets
    space.json           # metadata with space id
```

- Files are addressed directly by their SHA-256 hash.
- The path is derived as `space-v1/files/sha256/<hash[0..1]>/<hash[2..]>`.
- The CAS is deduplicated by construction; identical bytes map to the same path.

### Files AppTree (logical structure and metadata)
A dedicated app tree holds folders and files as vertices; this is a browsable logical view while the bytes remain in CAS on disk.

- Folder vertex properties:
  - `_n: "folder"`, `name: string`, `createdAt: number`
- File vertex properties:
  - `_n: "file"`, `name: string`
  - `hash: "<hex>"`
  - Optional: `mimeType`, `size`, `width`, `height`, `alt`, `tags[]`, `createdAt`

Helper APIs in `@sila/core`:
- `FilesTreeData.createNewFilesTree(space)` → creates an app tree and marks root with `appKind: 'files'` and `files` folder
- `FilesTreeData.ensureFolderPath(filesTree, [segments])` → creates/returns nested folders
- `FilesTreeData.createOrLinkFile({...})` → creates a file vertex with metadata or returns existing

### FileStore API (desktop)
Provided by `@sila/core` under `spaces/files`:

```ts
export interface FileStore {
  putDataUrl(dataUrl: string): Promise<{ hash: string; mimeType?: string; size: number }>;
  putBytes(bytes: Uint8Array, mimeType?: string): Promise<{ hash: string; size: number }>;
  exists(hash: string): Promise<boolean>;
  getBytes(hash: string): Promise<Uint8Array>;
  getDataUrl(hash: string): Promise<string>;
  delete(hash: string): Promise<void>; // no-op in Phase 1
}
```

Create a FileStore instance when a desktop file system is available:

```ts
const fileStore = createFileStore({
  getSpaceRootPath: () => spaceRootPath,
  getFs: () => appFileSystem
});
```

Internals:
- Computes SHA-256 over bytes to form hash
- Derives CAS path; writes only if it does not exist
- `getDataUrl` returns a `data:application/octet-stream;base64,...` for previews; callers may override MIME when known

### Read/Write flows
- Write:
  - UI obtains data URLs or bytes
  - `fileStore.putDataUrl(...)` or `fileStore.putBytes(...)` → returns `hash`
  - Ensure `files/YYYY/MM/DD` folder exists in Files AppTree
  - Create a `file` vertex with `hash` and metadata
  - Attach JSON references from messages to the file vertex if needed
- Read:
  - Resolve message file reference to the file vertex
  - Read `hash` and load bytes or data URL from CAS via `FileStore`

### Integration: Chat attachments (Phase 1)
See also: `docs/dev/proposals/attach-files.md`.

- When a user message carries image attachments (data URLs), the backend persists them to CAS if a desktop `FileStore` is available.
- A Files AppTree is ensured (created on demand) and a date-based folder path is used: `files/YYYY/MM/DD/chat`.
- For each image, a `file` vertex is created with metadata and `hash = <hex>`.
- The chat message `attachments` property is stored as JSON references of the form:
  - `{ id, kind: 'image', name?, alt?, file: { tree: <filesTreeId>, vertex: <fileVertexId> } }`.
- For immediate UI preview, transient `attachmentsDataUrl` is set on the message and ignored by persistence.
- If persistence is not available or fails, attachments remain transient in-memory as before.

### Obtaining a FileStore in core
- `SpaceManager` wires the `FileSystemPersistenceLayer` to a `Space` by setting a provider so `space.getFileStore()` returns a valid `FileStore` on desktop.
- Apps can call `space.getFileStore()` and use `FilesTreeData` to organize metadata under the Files AppTree.

### Persistence and CRDT
- Only metadata and references are stored as CRDT vertex operations under app trees
- Binary bytes are not part of ops; they are stored in the workspace CAS folder
- `FileSystemPersistenceLayer` filters transient properties and batches ops to disk

### Platform notes
- Desktop: `AppFileSystem` now supports `readBinaryFile(path)`. Electron and Node bindings implement it.
- Web: IndexedDB persistence for blobs is out of scope for Phase 1; UI may keep attachments in-memory.

### Garbage collection (future)
- Phase 1 does not delete blobs. Future maintenance can scan live `hash`es and reclaim unreferenced files.