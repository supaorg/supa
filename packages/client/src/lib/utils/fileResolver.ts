import { clientState } from '../state/clientState.svelte';
import { FileResolver, type ResolvedFileInfo, type FileReference } from '@sila/core/spaces/files/FileResolver';

export { type ResolvedFileInfo, type FileReference };

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

  /**
   * Gets file metadata without generating URL (for lightweight operations)
   */
  static async getFileMetadata(fileRef: FileReference): Promise<Omit<ResolvedFileInfo, 'url'> | null> {
    if (!clientState.currentSpace) {
      return null;
    }

    const fileResolver = new FileResolver(clientState.currentSpace);
    return await fileResolver.getFileMetadata(fileRef);
  }
}