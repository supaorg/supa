import { clientState } from '../state/clientState.svelte';
import type { FileReference } from '@sila/core/spaces/files/FileResolver';

export interface ResolvedFileInfo {
  id: string;
  name: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  dataUrl: string;
  hash: string;
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

    try {
      // Load the files app tree
      const filesTree = await clientState.currentSpace.loadAppTree(fileRef.tree);
      if (!filesTree) {
        console.warn(`Files tree not found: ${fileRef.tree}`);
        return null;
      }

      // Get the file vertex
      const fileVertex = filesTree.tree.getVertex(fileRef.vertex);
      if (!fileVertex) {
        console.warn(`File vertex not found: ${fileRef.vertex}`);
        return null;
      }

      // Extract metadata from the file vertex
      const hash = fileVertex.getProperty('hash') as string;
      const name = fileVertex.getProperty('name') as string;
      const mimeType = fileVertex.getProperty('mimeType') as string;
      const size = fileVertex.getProperty('size') as number;
      const width = fileVertex.getProperty('width') as number;
      const height = fileVertex.getProperty('height') as number;

      if (!hash) {
        console.warn(`File vertex missing hash: ${fileRef.vertex}`);
        return null;
      }

      // Get the file store and load bytes
      const fileStore = clientState.currentSpace.getFileStore();
      if (!fileStore) {
        console.warn('FileStore not available for resolving file references');
        return null;
      }

      // Load the bytes from CAS
      const bytes = await fileStore.getBytes(hash);

      // Convert bytes to data URL with proper MIME type
      const base64 = typeof Buffer !== 'undefined' 
        ? Buffer.from(bytes).toString('base64') 
        : btoa(String.fromCharCode(...bytes));
      const dataUrl = `data:${mimeType || 'application/octet-stream'};base64,${base64}`;

      return {
        id: fileRef.vertex,
        name: name || 'Unknown file',
        mimeType,
        size,
        width,
        height,
        dataUrl,
        hash,
      };
    } catch (error) {
      console.error('Failed to resolve file reference:', error);
      return null;
    }
  }

  /**
   * Resolves multiple file references
   */
  static async resolveFileReferences(fileRefs: FileReference[]): Promise<ResolvedFileInfo[]> {
    const resolved: ResolvedFileInfo[] = [];
    
    for (const fileRef of fileRefs) {
      const resolvedFile = await this.resolveFileReference(fileRef);
      if (resolvedFile) {
        resolved.push(resolvedFile);
      }
    }
    
    return resolved;
  }

  /**
   * Gets file metadata without loading the actual bytes (for lightweight operations)
   */
  static async getFileMetadata(fileRef: FileReference): Promise<Omit<ResolvedFileInfo, 'dataUrl'> | null> {
    if (!clientState.currentSpace) {
      return null;
    }

    try {
      const filesTree = await clientState.currentSpace.loadAppTree(fileRef.tree);
      if (!filesTree) {
        return null;
      }

      const fileVertex = filesTree.tree.getVertex(fileRef.vertex);
      if (!fileVertex) {
        return null;
      }

      const hash = fileVertex.getProperty('hash') as string;
      const name = fileVertex.getProperty('name') as string;
      const mimeType = fileVertex.getProperty('mimeType') as string;
      const size = fileVertex.getProperty('size') as number;
      const width = fileVertex.getProperty('width') as number;
      const height = fileVertex.getProperty('height') as number;

      return {
        id: fileRef.vertex,
        name: name || 'Unknown file',
        mimeType,
        size,
        width,
        height,
        hash,
      };
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      return null;
    }
  }
}