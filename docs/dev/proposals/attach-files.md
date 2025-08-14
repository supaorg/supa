## Attach images and files to chat messages

Goal: Allow users to attach images first (Phase 1), then other files later, to chat messages. In Phase 1 we will not implement persistent storage for attachments; we will keep attachments in memory during the session and send them to the LLM as base64. A later task will address durable storage and retrieval.

### Scope (Phase 1)
- User can attach one or more images to a user message via button or drag-and-drop
- Previews shown before sending; removable
- No disk persistence for assets; attachments are stored in-memory for the session only
- Images are sent to the model as base64 (not URLs)
- When supported by the selected model/provider, images are included in the LLM request
- Graceful fallback for models that don’t support vision (send textual reference/warning)

### Data model changes (core)
- Add a dedicated type and include it on `ThreadMessage`. In Phase 1, the attachment binary is kept in-memory (base64 data URL) and is not written to disk.

Proposed new types in `packages/core/src/models.ts`:
```ts
export type MessageAttachment = {
  id: string;                 // uuid
  kind: 'image' | 'file';     // file = any non-image file for now
  name: string;               // original filename
  mimeType: string;           // e.g. image/png, application/pdf
  size: number;               // bytes
  width?: number;             // images only
  height?: number;            // images only
  // Storage
  // Phase 1: keep in memory only; do not persist to disk
  path?: string | null;       // reserved for Phase 2 persistent storage
  dataUrl?: string | null;    // inline base64 for runtime use and request payloads
  createdAt: number;          // unix ms
};

declare module './models' {
  interface ThreadMessage {
    attachments?: MessageAttachment[] | null;
  }
}
```

Notes:
- Phase 1 avoids file-system writes. We keep `dataUrl` in memory and pass it to the LLM. `path` is reserved for the future persistent storage task.
- We avoid adding binary APIs to `AppFileSystem` in Phase 1.

### Storage layout (Phase 1: none)
- No disk persistence in Phase 1. Attachments live in memory (component state and message object) for the duration of the session.
- A follow-up proposal will define persistent storage on desktop (FS) and web/mobile (IDB/Blobs) and migration from in-memory to durable storage.

### UI/UX changes

In `packages/client/src/lib/comps/apps/ChatApp.svelte` and `SendMessageForm.svelte`:
- Add a paperclip button in the input area to trigger a hidden `<input type="file" multiple accept="image/*">`
- Add drag-and-drop on the message list container:
  - Visual drop overlay when dragging files over the chat
  - Filter to images in Phase 1; ignore oversized files with a toast
- Show selected attachments as chips/thumbnails above the textarea:
  - Image thumbnail with name and remove (×)
  - Enforce limits (default: 5 images, max 10MB each; configurable later)
- On send:
  - Create a user message with `attachments` populated
  - Persist files to disk (desktop) before updating the UI
  - Clear the pending attachments buffer in the form

Preview generation:
- Use `URL.createObjectURL` for local thumbs; read dimensions for images
- Optionally downscale client-side to width 1024px (canvas) before sending to reduce bandwidth/cost

Accessibility:
- Allow entering an alt text for each image (optional); include in prompt

### Backend changes

In `packages/core/src/apps/ChatAppBackend.ts`:
- Accept attachments when the last message is from the user
- When preparing the input for the agent, pass the messages unchanged; the agent will transform compatible attachments for the provider

In `packages/core/src/agents/SimpleChatAgent.ts`:
- Detect `attachments` on user messages
- Convert image attachments into provider-compatible message content when supported. Always send images as base64 (data URLs), not external URLs.
  - OpenAI-like (GPT‑4o family): use `image_url` with a `data:` URL containing base64
  - Gemini 1.5 family: use `inlineData` parts with base64 (subject to AIWrapper mapping)
- Fallback: if provider doesn’t support vision, prepend a system line like: “User attached N image(s): name1, name2. Describe what you can infer without seeing images.” and do not include image data

Provider capability detection:
- Use AIWrapper model metadata from `Lang.models` to detect vision capability (e.g., capabilities map or input types). Where capability metadata is missing, maintain a small allowlist by provider/model id as a fallback.

Privacy and confirmation:
- If model is a cloud provider and attachments are present, show a one-time confirmation: “Images will be sent to the provider for processing” with “Don’t ask again”

### API mapping (Phase 1)
We abstract within `SimpleChatAgent` so the rest of the app stays provider-agnostic. Images are provided as base64.

Pseudo-code inside `SimpleChatAgent`:
```ts
const supportsVision = providerSupportsVision(resolvedModel?.provider);
const langMessages: LangChatMessage[] = messages.flatMap(m => {
  if (!m.attachments || m.attachments.length === 0) return [{ role: mapRole(m), content: m.text ?? '' }];
  if (!supportsVision) return [{ role: mapRole(m), content: buildTextFallback(m) }];
  return buildMultimodalMessage(m); // returns one message with mixed text+image parts according to provider
});
```

For OpenAI-like providers:
- Convert each image to a `data:image/<type>;base64,...` URL and send as `image_url` content parts. Do not use hosted URLs.

For Gemini:
- Use base64 inline parts (`inlineData`) if supported by AIWrapper; otherwise, add an adapter layer within AIWrapper usage.

### Validation and limits
- Max images per message: 5 (configurable)
- Max size per image: 10MB (configurable)
- Allowed types: `image/png`, `image/jpeg`, `image/webp`

### Error handling
- Attachment load failure: show a chip with an error state; allow retry/removal
- Provider rejects attachment: convert to text fallback and continue

### Telemetry/perf (local console for now)
- Log image downscale timings and payload sizes

### Migration and compatibility
- Existing threads remain valid; new optional `attachments` field is ignored where absent
- UI controls appear immediately but can be gated by feature flag in settings: “Enable attachments”
- Phase 1 will not persist images to disk; users lose attachments after app restart. This is acceptable for initial testing.

### Implementation steps
1) Core types
   - Add `MessageAttachment` and `attachments?: MessageAttachment[]` to `ThreadMessage`
2) Client UI
   - Add file input + dropzone in `SendMessageForm.svelte`
   - Add local state for pending attachments; previews and removal (in-memory only)
   - Wire `send` to pass attachments to `ChatAppBackend` via `data.newMessage('user', text, attachments)`
3) Backend
   - Update `ChatAppData`/`ChatAppBackend` to support creating messages with attachments (no persistence)
   - Update `SimpleChatAgent` to transform attachments for providers that support vision; fallback otherwise. Always send base64.
4) Provider support
   - Implement OpenAI/GPT‑4o base64 image input path first
   - Add Google Gemini 1.5 base64 path second
5) QA
   - Test desktop drag-drop, file picker, previews, retries, stop behavior. Validate capability detection via `Lang.models`.

### Open questions / Future work
- Non-image files: PDFs/Docs → summarize/parse. Likely separate toolchain (embed/extract text client-side, attach as context)
- Binary FS API in `AppFileSystem` for cross-platform binary read/write
- Deduplicate identical attachments across messages (content hash)
- Redact EXIF/location metadata by default on images
- Attachment annotations (drawings), and OCR fallback when provider lacks vision

### Minimal changes required for Phase 1 (code hotspots)
- `packages/core/src/models.ts`: add `MessageAttachment`, extend `ThreadMessage`
- `packages/client/src/lib/comps/forms/SendMessageForm.svelte`: UI for selecting/removing images, emitting attachments with `onSend`
- `packages/client/src/lib/comps/apps/ChatApp.svelte`: pass attachments through `sendMsg`
- `packages/core/src/apps/ChatAppBackend.ts`: accept attachments when creating the user message; persist if desktop
- `packages/core/src/agents/SimpleChatAgent.ts`: convert attachments into multimodal messages where supported; fallback otherwise


