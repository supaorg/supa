import type { SimpleAttachment, LegacyAttachment } from '@sila/client/types/attachments';
import type { FileReference } from '@sila/core/spaces/files/FileResolver';

/**
 * Migration utility for converting between attachment formats
 */
export class AttachmentMigration {
  /**
   * Converts legacy attachments to simple attachments
   * Filters out attachments that don't have file references
   */
  static toSimpleAttachments(legacyAttachments: LegacyAttachment[]): SimpleAttachment[] {
    return legacyAttachments
      .filter(att => att.file?.tree && att.file?.vertex)
      .map(att => ({
        id: att.id,
        kind: att.kind as SimpleAttachment['kind'],
        file: att.file!,
        alt: att.alt,
      }));
  }

  /**
   * Converts simple attachments back to legacy format (for backward compatibility)
   */
  static toLegacyAttachments(simpleAttachments: SimpleAttachment[]): LegacyAttachment[] {
    return simpleAttachments.map(att => ({
      id: att.id,
      kind: att.kind,
      file: att.file,
      alt: att.alt,
    }));
  }

  /**
   * Validates if a message can be migrated to use simple attachments
   */
  static canMigrateMessage(message: any): boolean {
    const attachments = message?.attachments;
    if (!attachments || !Array.isArray(attachments)) {
      return true; // No attachments, can migrate
    }

    // Check if all attachments have file references
    return attachments.every((att: any) => 
      att?.file?.tree && att?.file?.vertex
    );
  }

  /**
   * Migrates a message to use simple attachments
   */
  static migrateMessage(message: any): any {
    if (!this.canMigrateMessage(message)) {
      console.warn('Cannot migrate message - some attachments lack file references:', message.id);
      return message; // Return original message unchanged
    }

    const attachments = message?.attachments;
    if (!attachments || !Array.isArray(attachments)) {
      return message; // No attachments to migrate
    }

    const simpleAttachments = this.toSimpleAttachments(attachments);
    
    return {
      ...message,
      attachments: simpleAttachments,
    };
  }

  /**
   * Creates a simple attachment from a file reference
   */
  static createSimpleAttachment(
    id: string,
    kind: SimpleAttachment['kind'],
    fileRef: FileReference,
    alt?: string
  ): SimpleAttachment {
    return {
      id,
      kind,
      file: fileRef,
      alt,
    };
  }

  /**
   * Extracts file references from a message
   */
  static extractFileReferences(message: any): FileReference[] {
    const attachments = message?.attachments;
    if (!attachments || !Array.isArray(attachments)) {
      return [];
    }

    return attachments
      .filter((att: any) => att?.file?.tree && att?.file?.vertex)
      .map((att: any) => att.file);
  }

  /**
   * Checks if a message has any file attachments
   */
  static hasFileAttachments(message: any): boolean {
    const attachments = message?.attachments;
    if (!attachments || !Array.isArray(attachments)) {
      return false;
    }

    return attachments.some((att: any) => 
      att?.file?.tree && att?.file?.vertex
    );
  }

  /**
   * Gets the count of file attachments in a message
   */
  static getFileAttachmentCount(message: any): number {
    const attachments = message?.attachments;
    if (!attachments || !Array.isArray(attachments)) {
      return 0;
    }

    return attachments.filter((att: any) => 
      att?.file?.tree && att?.file?.vertex
    ).length;
  }
}