import { clientState } from '../state/clientState.svelte';
import { FileResolver, type ResolvedFileInfo, type FileReference } from '@sila/core';

export { type ResolvedFileInfo, type FileReference };

/**
 * Extracts file references from a message object
 */
export function extractFileReferences(message: any): FileReference[] {
  if (!message || !message.attachments || !Array.isArray(message.attachments)) {
    return [];
  }

  return message.attachments
    .flatMap((att: any) => {
      // Bare FileReference persisted on message
      if (att && att.tree && att.vertex) return [att as FileReference];
      // Legacy/object-wrapped reference
      if (att && att.file && att.file.tree && att.file.vertex) return [att.file as FileReference];
      return [];
    });
}

export class ClientFileResolver {
  /**
   * Resolves a file reference to file information using the current space state
   */
  static async resolveFileReference(fileRef: FileReference): Promise<ResolvedFileInfo | null> {
    if (!clientState.currentSpace) {
      console.warn('No current space available for file resolution');
      return null;
    }

    const fileResolver = new FileResolver(clientState.currentSpace);
    return await fileResolver.resolveFileReference(fileRef);
  }

  /**
   * Resolves multiple file references
   */
  static async resolveFileReferences(fileRefs: FileReference[]): Promise<ResolvedFileInfo[]> {
    if (!clientState.currentSpace) {
      console.warn('No current space available for file resolution');
      return [];
    }

    const fileResolver = new FileResolver(clientState.currentSpace);
    return await fileResolver.resolveFileReferences(fileRefs);
  }
}