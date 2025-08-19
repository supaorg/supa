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