## Attach images and files to chat messages

Goal: Allow users to attach images first, then other files, to chat messages in the desktop and mobile apps. Show previews in the UI and send attachments to providers that support multimodal inputs. Keep data local-first while respecting provider capabilities and privacy.

### Scope (Phase 1)
- User can attach one or more images to a user message via button or drag-and-drop
- Previews shown before sending; removable
- Attachments persisted alongside the thread in the space
- When supported by the selected model/provider, images are included in the LLM request
- Graceful fallback for models that don’t support images (send textual reference/warning)

### Data model changes (core)
- Add a dedicated type and include it on `ThreadMessage`.

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
  path?: string | null;       // absolute or space-relative path (desktop/mobile FS)
  dataUrl?: string | null;    // inline base64 for transient/mobile/IDB
  createdAt: number;          // unix ms
};

declare module './models' {
  interface ThreadMessage {
    attachments?: MessageAttachment[] | null;
  }
}
```

Notes:
- We keep both `path` and `dataUrl` to support desktop FS and web/IndexedDB. One of them must be present.
- We avoid adding binary APIs to `AppFileSystem` in Phase 1. Desktop persists files on disk; web uses `dataUrl`.

### Storage layout
- Desktop (Electron): store under the current space root
  - `attachments/<threadId>/<messageId>/<attachmentId>.<ext>`
  - Save a tiny JSON index per message (or derive from the graph) is optional; the message already carries attachment metadata
- Mobile/web: store data URLs inside the message; optional optimization with IDB Blobs in a follow-up

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
- Convert image attachments into provider-compatible message content when supported
  - OpenAI/GPT‑4o style: content array with `{ type: 'text' | 'image_url' }`
  - Google Gemini style: contents/parts with `inlineData` or image URL
- Fallback: if provider doesn’t support vision, prepend a system line like: “User attached N image(s): name1, name2. Describe what you can infer without seeing images.” and do not send binary data

Provider capability detection:
- Prefer a capability API if AIWrapper exposes it in future (`Lang.models.capabilities`)
- Phase 1: simple allowlist by provider id: `openai`, `google`, `anthropic (new)`, `xai`, etc. We can iterate

Privacy and confirmation:
- If model is a cloud provider and attachments are present, show a one-time confirmation: “Images will be sent to the provider for processing” with “Don’t ask again”

### API mapping (Phase 1)
We abstract within `SimpleChatAgent` so the rest of the app stays provider-agnostic.

Pseudo-code inside `SimpleChatAgent`:
```ts
const supportsVision = providerSupportsVision(resolvedModel?.provider);
const langMessages: LangChatMessage[] = messages.flatMap(m => {
  if (!m.attachments || m.attachments.length === 0) return [{ role: mapRole(m), content: m.text ?? '' }];
  if (!supportsVision) return [{ role: mapRole(m), content: buildTextFallback(m) }];
  return buildMultimodalMessage(m); // returns one message with mixed text+image parts according to provider
});
```

For OpenAI-like providers that accept data URLs:
- Convert each image to a `data:image/<type>;base64,...` URL or write to a temporary local HTTP server (not planned) and send the URL

For Gemini:
- Prefer base64 inline parts if supported by AIWrapper; otherwise, we may need direct SDK calls later

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

### Implementation steps
1) Core types
   - Add `MessageAttachment` and `attachments?: MessageAttachment[]` to `ThreadMessage`
2) Client UI
   - Add file input + dropzone in `SendMessageForm.svelte`
   - Add local state for pending attachments; previews and removal
   - Wire `send` to pass attachments to `ChatAppBackend` via `data.newMessage('user', text, attachments)`
3) Persistence
   - Desktop: write files under `attachments/<threadId>/<messageId>/...`; store relative `path`
   - Web/mobile: store `dataUrl` in message; later optimize
4) Backend
   - Update `ChatAppData`/`ChatAppBackend` to support creating messages with attachments
   - Update `SimpleChatAgent` to transform attachments for providers that support vision; fallback otherwise
5) Provider support
   - Implement OpenAI/GPT‑4o image input path first
   - Add Google Gemini 1.5 second
6) QA
   - Test desktop drag-drop, file picker, previews, persistence, retries, and stop behavior

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


