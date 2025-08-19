## Chat-Scoped Files Under CAS (files vertex inside chat trees)

### Executive summary
- Store file bytes in CAS (unchanged). Reference them via file vertices; by default in the Files AppTree (current behavior), or optionally under a `files` folder inside a chat tree when explicitly targeted.
- Internal API uploads can target an explicit `treeId + path` (slash-separated, name-based). If no target is provided, fall back to the default Files app. This preserves CAS dedup and existing `sila://` resolution.

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
   - Targeting is explicit and path-based. Request includes:
     - `treeId?`: optional; when provided, indicates the app tree root to target (e.g., the chat tree).
     - `path?`: optional slash-separated, name-based path relative to `treeId` root; defaults to `files` when `treeId` is provided and `path` is omitted. Created on demand when `createParents=true`.
     - `createParents`: default true (creates `files` and subfolders lazily).
     - `conflict`: `"version" | "replace" | "fail"` (default `"version"`).
     - Bytes: either raw multipart bytes or higher-level processed data; server writes to CAS via FileStore and returns `hash`.
   - If neither `treeId` nor `path` is provided, use the default Files AppTree (current behavior).
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
  - Input: `{ treeId?: string, path?: string, name?: string, mimeType?: string, conflict?: 'version' | 'replace' | 'fail', createParents?: boolean }` + file bytes
  - Output: `{ treeId, vertexId, hash, name, mimeType, size }`

- List/browse (optional): list children under a folder (supports `path` resolution). Returns folder/file vertices.

### Resolution and UI
- Rendering: Resolve `{ tree, vertex } -> hash -> sila://...` using existing resolver + FileStore.
- UI: Chat view gets a Files tab bound to `chatTreeRoot/files`. Upload widgets default to this folder.

### Migration & compatibility
- Default behavior remains unchanged: when no target is specified, uploads go to the Files AppTree.
- When explicitly targeted to a chat tree, lazily create `files` if missing and save file vertices there.
- Existing files and message references continue to work. No reorganization/linking is performed automatically.

### Edge cases
- Path traversal/illegal characters sanitized. Deep path creation guarded by `createParents`.
- Name conflicts handled by `conflict` strategy; `version` appends numeric or hash suffix to `_n`.
- Broken references: if `hash` missing in CAS, UI renders error state.

### Acceptance criteria
- Upload with no target stores file info in the default Files AppTree (current behavior preserved) and returns `{ treeId, vertexId, hash }`.
- Upload targeted to a chat (`treeId` provided; optional `path` or default `files`) creates `files` (if absent) and a file vertex under it; bytes exist in CAS; response includes `{ treeId, vertexId, hash }`.
- Listing the chat’s `files` shows uploaded files that were targeted to that chat.
- Message attachments stored as `{ file: { tree, vertex } }` resolve to `sila://...` via file vertex `hash`.
- Duplicate bytes dedupe at CAS-level across any trees.

### Out of scope
- Changing CAS layout or `sila://` protocol.
- Server-side sharing/linking semantics beyond storing multiple vertices pointing at the same `hash`.

