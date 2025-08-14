## Attach images and files to chat messages

Goal: Allow users to attach images first (Phase 1), then other files later, to chat messages.

### Current state (implemented)
- User can attach one or more images to a user message via button or drag-and-drop (client UI)
- Previews shown before sending; removable
- Desktop persistence for images is implemented via CAS and Files AppTree (see `docs/dev/files-in-spaces.md`)
- Chat messages store `attachments` as JSON file references `{ file: { tree, vertex }, ... }` and keep transient `attachmentsDataUrl` for immediate previews
- Agent translation to provider formats (base64 parts) is implemented in `SimpleChatAgent` when data URLs are present

### Next steps / Phase 2 ideas
- Support non-image files (PDF, DOC, etc.) with appropriate metadata and previews
- Background thumbnail generation and caching
- EXIF/location stripping for privacy (optional)
- Garbage collection of unreferenced files
- Web/IndexedDB persistence for blobs

### Data model notes (Phase 1)
- `ThreadMessage.attachments` may hold JSON refs to Files AppTree vertices; UI may also keep `attachmentsDataUrl` transiently
- Files AppTree holds metadata; bytes live in CAS on disk

### UI/UX notes
- Paperclip button to add images; drag-and-drop on the message list
- Clips/thumbnails above textarea with remove controls and basic validation (limits, types)

### Backend notes
- In `ChatAppData.newMessage`, when a FileStore is available, images are written to CAS and refs are stored under the message
- In `SimpleChatAgent`, attachments with `dataUrl` are converted to base64 content parts for providers that support vision; fallback to text otherwise

### Validation and limits
- Max images per message, size limits, and accepted types are enforced in UI; back-end may add additional checks

### Future work (tracking)
- Multi-file types and previews
- Rich annotations and OCR
- Provider-specific upload URLs if/when we introduce remote sync


