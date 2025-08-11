## Better Chat – QA Checklist (August 2025)

Branch: `feat/better-chat-august-2025`

Scope included in this QA pass:
- Re-run any AI message in a new branch
- Add info about the current model to the system prompt
- Save the model id/provider used in an AI message
- Show a popover with info about the assistant message (incl. model used)
- Improve message editing form sizing and buttons

### Prerequisites
- From repo root: `npm install` (first time), then `npm run dev` to run desktop dev, or `npm -w packages/desktop run build` to build.
- Ensure at least one model provider is configured.

### 1) Re-run any AI message in a new branch
Steps
- Start a chat, send a user message, wait for the assistant reply.
- Hover the assistant message to reveal the toolbar and click the rerun icon (two arrows), or click the "Re-run (new branch)" button if shown next to "Retry".

Expected
- A new assistant message is created as a sibling under the same user message (branch count increases).
- Original assistant reply remains unchanged; new reply streams into the new branch.
- Prev/Next branch arrows cycle between branches; the counter updates (e.g., 1/2, 2/2).
- Retry continues to work as before.

Notes
- Re-run is supported for assistant messages that directly follow a user message. If the structure differs, the action may no-op.

### 2) Model info added to system prompt (internal)
Steps
- Normal chat flow across different providers/models (e.g., switch provider/model, then send a message).

Expected
- No regressions in response quality or streaming.
- This is internal; there is no dedicated UI for this line, but behavior should remain stable.

### 3) Model id/provider saved on assistant messages
Steps
- Send a new message after selecting a provider/model. If using an "auto" configuration, ensure a concrete model is resolved.
- Open the assistant message info popover (see next section).

Expected
- The popover shows `Model: <provider>/<model>`. Provider and resolved model match the selected configuration.
- Changing provider/model for subsequent messages updates the recorded values in new messages.

### 4) Assistant message info popover
Steps
- Click the Info icon next to the assistant name on any assistant message.

Expected
- Popover shows:
  - Assistant: name (from config)
  - Model: `<provider>/<model>` (or `?/ ?` for old messages without metadata)
  - Created: timestamp; Updated: timestamp if present
  - Message ID
- Popover can be closed; it does not block scrolling.

### 5) Message editing form sizing and buttons
Steps
- Hover a message to reveal the toolbar; click Edit.
- Type multiple lines.
- Press Enter to submit (Shift+Enter for newline), or click Send/Cancel.

Expected
- Wider editor (up to 700px) with larger textarea and comfortable padding.
- Textarea auto-expands to fit content without scrollbars (for typical lengths).
- Send is primary-styled; Cancel is outline-styled.
- After Save, a new branch is created with the edited text selected as main.

### Regression checks
- Streaming updates still show "Thinking..." and then the final content.
- The Thoughts expander (if present) expands/collapses and scrolls within its area.
- Stop generation works and clears the in-progress state.
- Branch navigation (arrows and counter) works with 1+ branches.
- Assistant label shows the configured assistant name when available.
- With no providers configured, the message form shows the setup state as before.

### Backward compatibility
- Old threads without recorded model info should still work; the popover displays `Model: ?/?` for those older messages.

### Out of scope / known limitations
- Re-run in new branch only applies to assistant messages directly following a user message.
- System prompt metadata is informational for the model; there is no direct UI surface for it.


