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
- Persisted on message: `FileReference`
  - `{ tree, vertex }` only
  - No id/kind/name/mime/size/dims/alt/dataUrl
- Resolved for consumption/display: `ResolvedFileInfo`
  - Derive any UI grouping ("kind") from `mimeType` (e.g., `image/*` → image, `text/*` → text)

Additional rule:
- No fallbacks: if persistence fails or no `FileStore` is present, creation fails. UI must ensure storage is available.
- Do not write transient previews into the message. `dataUrl` exists only in `AttachmentPreview` pre-save and in resolved data returned by the resolver.

## Scope approved to implement now
- Remove duplicated fields from `MessageAttachmentRef` (name/mime/size/width/height, dataUrl)
- Do not persist `dataUrl` inside message `attachments`
- Keep transient previews in `attachmentsPreview` only

Status: Implemented
- Core: `MessageAttachmentRef` established; `ChatAppData` persists only refs and requires `FileStore` (no preview/transient writes)
- Tests: Updated to assert refs-only persistence and resolver-based data access

## Next steps (proposed)
1. Resolver-first consumption (reasoning):
   - Why: Persisted refs are minimal; consumers need authoritative metadata (name/mime/size/dims) and bytes from the file vertex. Centralizing this in the resolver removes duplication and drift.
   - What: Use `ResolvedFileInfo` as the output; do not rely on fields on attachments. If needed, derive a `kind` in UI from `mimeType`.
   - How: Ensure `FileResolver.resolveAttachments` returns `ResolvedFileInfo[]`. Migrate `SimpleChatAgent` and UI to rely on resolver output exclusively.
2. Standardize union naming (reasoning):
   - Why: One name reduces cognitive load and import churn. `Entry` was ambiguous.
   - What: Persisted attachments are `FileReference[]`. Keep `MessageAttachment` only as a temporary alias if needed during migration.
3. Resolver-only metadata (reasoning):
   - Why: Avoid stale metadata on attachments and ensure single source of truth.
   - What: UI/agent resolve refs before rendering/processing. Never read name/mime/size/dims from the attachment object.
4. Optional: unify IDs (reasoning):
   - Why: Simplifies joins between refs, resolved info, and UI elements.
   - What: Post-save, consider adopting the file vertex id as the attachment id (with a migration adapter to keep backward compatibility).

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
- `FileReference[]` on messages (persisted)
- `ResolvedFileInfo[]` from resolver for UI/agent
