# Proposal: Simplify attachment types and file metadata flow

## Summary
Unify and simplify how files flow from UI to persistence to AI.
- Keep one clear type per stage: UI preview, persisted ref, and resolved file info.
- Persist only file references and minimal attachment metadata; never persist data URLs.
- Resolve metadata/bytes from the Files tree when needed instead of duplicating on attachments.

## Goals
- Make the pipeline easy to reason about at a glance
- Remove duplicated fields carried across objects
- Reduce accidental divergence between UI previews and persisted state
- Keep tests deterministic and clear

## Current pipeline (simplified)
1. UI composes `AttachmentPreview` (image/text) with `dataUrl`/`content`.
2. `ChatAppData.newMessage()` persists attachments. Previously we stored refs plus extra fields and copied `dataUrl` into `attachments`.
3. `SimpleChatAgent`/UI read `message.attachments` and sometimes expect `dataUrl`, sometimes file refs.
4. `FileResolver` also exposes `ResolvedAttachment` and `ResolvedFileInfo`.

Pain points:
- Multiple overlapping types with similar fields (`ResolvedAttachment`, `ResolvedFileInfo`)
- Duplicated metadata on persisted attachments (name/mime/size/dims, even `dataUrl`)
- Hard to tell which fields are authoritative

## Proposed target model
- UI (pre-save): `AttachmentPreview`
  - id, kind ('image'|'text'|'file'), name, mimeType, size, width, height
  - dataUrl? (image), content? (text), alt?
- Persisted on message: `MessageAttachmentRef`
  - id, kind, file: FileReference, alt?
  - No name/mime/size/dims/dataUrl
- Resolved for consumption/display: `ResolvedFileInfoWithKind`
  - Reuse `ResolvedFileInfo` and add `id` and `kind` for context

Additional rule:
- If immediate image preview is needed right after save, attach a transient property `attachmentsPreview: AttachmentPreview[]` on the message vertex. Do not persist it.

## Scope approved to implement now
- Remove duplicated fields from `MessageAttachmentRef` (name/mime/size/width/height, dataUrl)
- Do not persist `dataUrl` inside message `attachments`
- Keep transient previews in `attachmentsPreview` only

Status: Implemented
- Core: `MessageAttachmentRef` established, `ChatAppData` persists only refs and writes transient `attachmentsPreview` (not persisted)
- Tests: Updated to assert refs-only persistence and to resolve `dataUrl` via resolver when needed

## Next steps (proposed)
1. Replace `ResolvedAttachment` usages with `ResolvedFileInfo` + `id` + `kind`
   - Introduce a small helper type in core (e.g., `ResolvedFileInfoWithKind`)
   - Update `FileResolver.resolveAttachments` to return that shape
   - Update `SimpleChatAgent` and UI call sites
2. Standardize union naming
   - Rename `MessageAttachmentEntry` → `MessageAttachment` (alias)
   - Use it everywhere a message may carry either a persisted ref or (rarely) a transient preview
3. Lean on `FilesTreeData.getFileInfo`/`FileResolver` instead of reading metadata from attachments
   - UI components should fetch metadata (name/mime/size/dims) via resolver or file vertex when rendering
4. Optional: unify IDs
   - After persistence, consider using file vertex id as the attachment id to simplify mapping

## Migration strategy
- Step 1 (done): persist-only refs; add transient previews; update tests
- Step 2: add `ResolvedFileInfoWithKind` and migrate resolver/agent/UI
- Step 3: replace `MessageAttachmentEntry` alias and adjust imports
- Step 4: sweep UI to remove reliance on attachment metadata fields; fetch from resolver
- Step 5 (optional): ID unification behind a small adapter (non-breaking) and then flip call sites

## Impact
- Core types: smaller, clearer attachment ref
- File resolver: slight API change (addition of `kind`/`id` in resolved)
- UI and agent: simpler assumptions; preview behavior unchanged, but no persisted data URLs
- Tests: already aligned for step 1; minor updates for resolver shape in step 2

## Open questions
- Do we want `alt` on refs, or should it also be derived/optional elsewhere?
- Should we standardize attachment `id` to be the file vertex id post-save?

## Appendix: quick reference (target)
- `AttachmentPreview` (UI only)
- `MessageAttachmentRef` (persisted)
- `MessageAttachment` = `MessageAttachmentRef | AttachmentPreview` (alias)
- `ResolvedFileInfoWithKind` (display/agent)
