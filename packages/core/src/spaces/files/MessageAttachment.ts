import type { FileReference } from './FileResolver';
import type { AttachmentKind, AttachmentPreview } from './AttachmentPreview';

/**
 * Reference to a file stored in the Files tree, attached to a chat message.
 * May include optional metadata useful for UI.
 * Can temporarily include a transient dataUrl for immediate preview after save.
 */
export interface MessageAttachmentRef {
  id: string;
  kind: AttachmentKind;
  alt?: string;
  file: FileReference;
}

// The message attachments array can contain either persisted refs or transient previews in error cases
export type MessageAttachment = MessageAttachmentRef | AttachmentPreview;
// Backward-compat alias; prefer MessageAttachment going forward
export type MessageAttachmentEntry = MessageAttachment;


