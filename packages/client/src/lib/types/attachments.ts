import type { FileReference } from '@sila/core/spaces/files/FileResolver';

/**
 * Simplified attachment interface that only contains file references
 * This replaces the current attachment format that includes full metadata
 */
export interface SimpleAttachment {
  id: string;
  kind: 'image' | 'text' | 'video' | 'pdf' | 'file';
  file: FileReference;
  alt?: string; // Optional alt text for accessibility
}

/**
 * Legacy attachment format for backward compatibility
 * Contains both file reference and transient data for immediate preview
 */
export interface LegacyAttachment {
  id: string;
  kind: string;
  name?: string;
  alt?: string;
  dataUrl?: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  file?: FileReference;
  content?: string; // For text files
}

/**
 * Type guard to check if an attachment is a simple file reference
 */
export function isSimpleAttachment(attachment: any): attachment is SimpleAttachment {
  return attachment && 
         typeof attachment.id === 'string' &&
         typeof attachment.kind === 'string' &&
         attachment.file &&
         typeof attachment.file.tree === 'string' &&
         typeof attachment.file.vertex === 'string';
}

/**
 * Type guard to check if an attachment is a legacy format
 */
export function isLegacyAttachment(attachment: any): attachment is LegacyAttachment {
  return attachment && 
         typeof attachment.id === 'string' &&
         typeof attachment.kind === 'string' &&
         (attachment.dataUrl || attachment.file || attachment.content);
}

/**
 * Convert a legacy attachment to a simple attachment
 */
export function toSimpleAttachment(legacy: LegacyAttachment): SimpleAttachment | null {
  if (!legacy.file) {
    return null; // Can't convert without file reference
  }

  return {
    id: legacy.id,
    kind: legacy.kind as SimpleAttachment['kind'],
    file: legacy.file,
    alt: legacy.alt,
  };
}

/**
 * Convert a simple attachment to a legacy attachment (for backward compatibility)
 */
export function toLegacyAttachment(simple: SimpleAttachment): LegacyAttachment {
  return {
    id: simple.id,
    kind: simple.kind,
    file: simple.file,
    alt: simple.alt,
  };
}