## Save files in workspaces (content-addressed storage + Files AppTree)

Goal: Introduce a durable, content-addressed file store for binary assets (images, PDFs, etc.) inside each workspace, referenced from app trees. Desktop (FileSystem) only for Phase 1; browser/IndexedDB will remain in-memory for assets for now.

### Status
Implemented in Phase 1 for desktop. See `docs/dev/files-in-spaces.md` for the current design and API usage.

### Notes
- CAS layout: `space-v1/files/sha256/<2>/<rest>.bin`
- Files AppTree helpers are implemented in core (`FilesTreeData`)
- FileStore API is implemented in core and wired via `SpaceManager` + `FileSystemPersistenceLayer`
- Chat attachments store JSON refs to Files AppTree and keep transient previews

### Future work
- IndexedDB/Blobs-backed file store for web/mobile
- Remote sync and partial downloads
- Background thumbnail generation and caching
- Optional EXIF stripping and additional metadata


