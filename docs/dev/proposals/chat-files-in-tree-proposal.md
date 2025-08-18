## Chat-Scoped Files Under CAS (files vertex inside chat trees)

### Executive summary
- Store file bytes in CAS (unchanged). Reference them via file vertices that live under a `files` folder inside each chat tree, instead of a single global Files AppTree.
- Internal API uploads target an explicit tree and folder (defaulting to a chat’s `files` vertex). This preserves CAS dedup and existing `sila://` resolution.

### Current model (source of truth)
- Bytes: Content-Addressed Storage (CAS), keyed by SHA-256 `hash` at `{spaceRoot}/space-v1/files/sha256/{prefix}/{rest}`.
- FileStore API: `putBytes(bytes, mime) -> { hash, size }`, `getBytes(hash)`, `getDataUrl(hash)`.
- Serving: Electron custom protocol `sila://spaces/{spaceId}/files/{hash}?type={mime}` resolves to CAS path.
- Trees: Files are modeled as vertices with metadata including `hash`. Messages don’t embed bytes; they reference files as `{ tree: <treeId>, vertex: <vertexId> }`.

### Problem
- Today attachments often land in a single Files AppTree, coupling all chats to a shared library. We want per-chat containment while keeping CAS, dedup, and resolution unchanged.

### Proposal
1. Per-chat `files` folder
   - Add a `files` vertex directly under each chat app tree root.
   - Store file vertices (and optional subfolders) beneath it.

2. File vertex schema (unchanged in spirit)
   - Minimal required: `{ _n: <filename>, hash: <sha256>, mimeType?: string, size?: number, createdAt?: number, createdBy?: string }`.
   - Optional media metadata (width/height, duration, etc.) remain allowed.

3. Attachment references
   - Message attachments store `file: { tree: <chatTreeId>, vertex: <fileVertexId> }` pointing to the chat-local file vertex.
   - Cross-tree references remain supported if needed (e.g., shared library), but default is chat-local.

4. Upload target semantics (internal API)
   - Target is explicit and tree-first, CAS-aware. Request includes:
     - `treeId`: required when saving; typically the chat tree id.
     - `folderVertexId` OR `path`: optional; defaults to the chat’s `files` vertex. `path` is slash-separated, created on demand.
     - `createParents`: default true (creates `files` and subfolders lazily).
     - `conflict`: `"version" | "replace" | "fail"` (default `"version"`).
     - Bytes: either raw multipart bytes or higher-level processed data; server writes to CAS via FileStore and returns `hash`.
   - Response returns the created/linked file vertex: `{ treeId, vertexId, hash, name, mimeType, size }`.

5. Behavior
   - CAS remains the single source of bytes and deduplication (same `hash` across any number of vertices/trees).
   - Tree operations only manipulate metadata/structure; no blob data in CRDT ops.
   - `sila://` resolution continues to use `hash` from the file vertex.

### Tree layout
- Chat tree root
  - `files` (folder vertex; created lazily)
    - subfolders (optional)
    - file vertices (each with a `hash` pointing to CAS)

### API shape (sketch)
- Upload (internal): create bytes in CAS, then create/link a file vertex under the target folder.
  - Input: `{ treeId, folderVertexId? | path?: string, name?: string, mimeType?: string, conflict?: 'version' | 'replace' | 'fail', createParents?: boolean }` + file bytes
  - Output: `{ treeId, vertexId, hash, name, mimeType, size }`

- List/browse (optional): list children under a folder (supports `path` resolution). Returns folder/file vertices.

### Resolution and UI
- Rendering: Resolve `{ tree, vertex } -> hash -> sila://...` using existing resolver + FileStore.
- UI: Chat view gets a Files tab bound to `chatTreeRoot/files`. Upload widgets default to this folder.

### Migration & compatibility
- New uploads for chats target the chat’s `files` by default. Lazily create `files` if missing.
- Existing files in the global Files AppTree remain valid. Messages that point there continue to work. Optional background task can clone/link metadata into chat-local folders if desired (bytes remain deduped by CAS).

### Security & policy
- Writes are permitted based on access to `treeId` and folder vertex. Inherit ACLs from the chat tree; subfolders may override if the model supports it.
- Enforce size/mime limits during CAS write. Optional scanning prior to vertex finalization.

### Edge cases
- Path traversal/illegal characters sanitized. Deep path creation guarded by `createParents`.
- Name conflicts handled by `conflict` strategy; `version` appends numeric or hash suffix to `_n`.
- Broken references: if `hash` missing in CAS, UI renders error state.

### Acceptance criteria
- Uploading a file with only `treeId` pointing to a chat tree creates `files` (if absent) and a file vertex under it; bytes exist in CAS; response includes `{ treeId, vertexId, hash }`.
- Listing the chat’s `files` shows uploaded files.
- Message attachments stored as `{ file: { tree, vertex } }` resolve to `sila://...` via file vertex `hash`.
- Duplicate bytes dedupe at CAS-level across any trees.

### Out of scope
- Changing CAS layout or `sila://` protocol.
- Server-side sharing/linking semantics beyond storing multiple vertices pointing at the same `hash`.

