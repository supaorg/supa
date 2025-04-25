# Proposal: Branching Edits for Chat Messages

## Motivation

Currently, Supa’s chat supports linear message threads. To enable editing of user messages while preserving history and supporting alternative conversation paths, we propose a branching model:  
**Editing a user message creates a new branch in the same chat, with all subsequent messages belonging to the new branch.**

---

## Current Model Overview

- **Message Storage:**  
  Messages are stored as a chain of vertices in the app tree (`ChatAppData`), each with a parent-child relationship.
- **Creation:**  
  New messages are appended as children of the last message vertex (`newMessage` in `ChatAppData`).
- **UI:**  
  The client (`ChatApp.svelte`, `ChatAppMessage.svelte`) displays a linear list of messages.

---

## Proposed Changes

### 1. Message Tree Structure

- **RepTree already supports parent/children:**
  - No schema change is needed; each message vertex already has a parent and can have multiple children.

- **Branching on Edit:**
  - When editing a user message, create a new child vertex from the edited message’s parent, with the new content.
  - All subsequent (descendant) messages for that branch are new vertices under the edited message.
  - The original message and its descendants remain as an alternate branch.

- **Marking the Main Path:**
  - The new message vertex (branch) is marked with a `main: true` property.
  - The previous "main" message at that fork point has its `main` property removed.
  - This allows easy traversal of the "main" path by default, while supporting alternate branches.

- **Message Model Update:**
  - Each message already stores its parent.
  - Messages are traversed as a tree, with the "main" property indicating the default branch at each fork.

### 2. Editing Workflow

- **Edit Action:**
  - User clicks “Edit” on their own message. An editing UI is shown.
  - After the user completes editing and confirms (e.g., clicks “Save” or “Submit”), the app creates a new message vertex as a sibling to the original, with the same `parentId` and the updated content.
  - The new message is marked as `main: true`; the previous "main" at this fork has its `main` property removed.
  - All new messages are appended to this new branch.

- **Branch Selection:**
  - The UI and logic traverse the "main" path by default (following the `main: true` child at each fork).
  - Optionally, indicate when alternate branches exist (e.g., a “fork” icon) and allow users to switch to them.

### 3. UI/UX

- **Minimal initial UI:**
  - When a message is edited, switch the view to the new branch.
  - Show a subtle indicator if a message has alternate branches (e.g., “edited”, or a branch icon).
  - Optionally, allow users to switch between branches at fork points.

---

## Implementation Steps

1. **Backend/Model:**
   - No changes needed to the underlying data structure: messages are already stored as a tree (via RepTree).
   - Update message fetching logic: if a vertex has multiple children (a fork), follow the child with `main: true`; otherwise traverse the only child.
   - On edit, create a new sibling under the original parent with the updated content. If this creates a fork (parent now has >1 children), mark the new vertex `main: true` and clear `main` on the previous main; single-child parents don't require a `main` flag.
   - Append all subsequent messages as siblings under the same parent as the edited message, forming the new branch: edited message → assistant reply → user message → etc.

2. **Frontend:**
   - Add “Edit” option for user messages in `ChatAppMessage.svelte`.
   - On edit, show an editing UI; after saving, create a new message as described above and switch UI to the new branch.
   - Update message rendering to handle forks (show indicator, allow branch switching at fork points).

3. **Migration:**
   - No migration is needed: messages have always been stored as a tree, and multiple children per message are already supported.
   - The only change is marking and traversing the "main" branch for default UI display and editing.

---

## Answers to Open Questions

- **Editing:**
  - Any user message can be edited (not just the last one).
- **Assistant messages after edit:**
  - After editing, the assistant will be run again and a new assistant message will be created under the edited message (new branch).
- **Branch selection UI:**
  - Use a subtle branch switcher, such as [1] [2] [3], and/or arrows for navigation between branches at fork points.

---

## Summary

This proposal enables non-destructive editing of user messages via branching, preserving chat history and supporting exploration of alternate conversation paths, with minimal changes to the current architecture.

---

**Next Steps:**  
- Review and refine the branching model.
- Implement backend changes to support message trees.
- Prototype frontend UI for editing and branch navigation.
