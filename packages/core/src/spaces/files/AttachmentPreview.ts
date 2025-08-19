export type AttachmentKind = 'image' | 'text' | 'file';

/**
 * Attachment preview passed from UI to core when creating messages.
 * This type intentionally allows some transient fields (like dataUrl/content)
 * so the UI can render immediate previews before persistence.
 */
export interface AttachmentPreview {
  id: string;
  kind: AttachmentKind;
  name: string;
  mimeType: string;
  size: number;

  // Transient content for previews (images/text)
  dataUrl?: string; // For images or other previewable files
  content?: string; // For text files (used to persist to CAS)

  // Generic optional metadata used by UI; intentionally untyped to avoid core↔client coupling
  metadata?: any;

  // Common dimensions/metrics; for text we may reuse as line/char counts
  width?: number;
  height?: number;

  // Accessibility or auxiliary info (e.g., language for text)
  alt?: string;
}


