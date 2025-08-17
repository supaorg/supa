import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FileReference } from '@sila/core/spaces/files/FileResolver';

// Mock the client state for browser testing
const mockClientState = {
  currentSpace: null as any,
};

// Mock file store for browser environment
class MockFileStore {
  private files = new Map<string, Uint8Array>();

  async putBytes(bytes: Uint8Array, mimeType?: string) {
    const hash = await this.computeHash(bytes);
    this.files.set(hash, bytes);
    return { hash, size: bytes.length };
  }

  async putDataUrl(dataUrl: string) {
    const base64 = dataUrl.split(',')[1];
    const bytes = new Uint8Array(Buffer.from(base64, 'base64'));
    return this.putBytes(bytes);
  }

  async getBytes(hash: string) {
    const bytes = this.files.get(hash);
    if (!bytes) {
      throw new Error(`File not found: ${hash}`);
    }
    return bytes;
  }

  async getDataUrl(hash: string) {
    const bytes = await this.getBytes(hash);
    const base64 = Buffer.from(bytes).toString('base64');
    return `data:application/octet-stream;base64,${base64}`;
  }

  async exists(hash: string) {
    return this.files.has(hash);
  }

  private async computeHash(bytes: Uint8Array): Promise<string> {
    // Simple hash for testing - in real implementation this would be SHA-256
    let hash = 0;
    for (let i = 0; i < bytes.length; i++) {
      const char = bytes[i];
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16).padStart(64, '0');
  }
}

// Mock space and app tree for browser testing
class MockSpace {
  private appTrees = new Map<string, MockAppTree>();
  private fileStore = new MockFileStore();

  constructor(public id: string) {}

  async newAppTree(appId: string) {
    const tree = new MockAppTree(appId);
    this.appTrees.set(tree.id, tree);
    return tree;
  }

  async loadAppTree(treeId: string) {
    return this.appTrees.get(treeId);
  }

  getFileStore() {
    return this.fileStore;
  }
}

class MockAppTree {
  public id: string;
  public tree: MockTree;

  constructor(appId: string) {
    this.id = `${appId}-${Math.random().toString(36).substr(2, 9)}`;
    this.tree = new MockTree();
  }

  getId() {
    return this.id;
  }
}

class MockTree {
  private vertices = new Map<string, MockVertex>();

  constructor() {
    // Create root vertex
    const root = new MockVertex('root', { _n: 'root' });
    this.vertices.set('root', root);
  }

  newVertex(parentId: string, properties: Record<string, any>) {
    const id = `vertex-${Math.random().toString(36).substr(2, 9)}`;
    const vertex = new MockVertex(id, properties);
    this.vertices.set(id, vertex);
    return vertex;
  }

  getVertex(id: string) {
    return this.vertices.get(id);
  }

  getVertexByPath(path: string) {
    // Simple path resolution for testing
    if (path === 'files') {
      const filesVertex = new MockVertex('files', { _n: 'files' });
      this.vertices.set('files', filesVertex);
      return filesVertex;
    }
    return this.vertices.get(path);
  }
}

class MockVertex {
  public id: string;
  private properties: Record<string, any>;

  constructor(id: string, properties: Record<string, any>) {
    this.id = id;
    this.properties = properties;
  }

  getProperty(key: string) {
    return this.properties[key];
  }

  setProperty(key: string, value: any) {
    this.properties[key] = value;
  }
}

// Mock the ClientFileResolver for browser testing
class MockClientFileResolver {
  static async resolveFileReference(fileRef: FileReference) {
    if (!mockClientState.currentSpace) {
      return null;
    }

    try {
      const filesTree = await mockClientState.currentSpace.loadAppTree(fileRef.tree);
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

      if (!hash) {
        return null;
      }

      const fileStore = mockClientState.currentSpace.getFileStore();
      if (!fileStore) {
        return null;
      }

      const bytes = await fileStore.getBytes(hash);
      const base64 = Buffer.from(bytes).toString('base64');
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

  static async resolveFileReferences(fileRefs: FileReference[]) {
    const resolved = [];
    for (const fileRef of fileRefs) {
      const resolvedFile = await this.resolveFileReference(fileRef);
      if (resolvedFile) {
        resolved.push(resolvedFile);
      }
    }
    return resolved;
  }
}

// Simple attachment types for testing
interface SimpleAttachment {
  id: string;
  kind: 'image' | 'text' | 'video' | 'pdf' | 'file';
  file: FileReference;
  alt?: string;
}

interface LegacyAttachment {
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
  content?: string;
}

// Utility functions for testing
class FilePreviewUtils {
  static extractFileReferences(message: any): FileReference[] {
    const attachments = message?.attachments;
    if (!attachments || !Array.isArray(attachments)) {
      return [];
    }

    return attachments
      .filter((att: any) => att?.file?.tree && att?.file?.vertex)
      .map((att: any) => att.file);
  }

  static hasFileAttachments(message: any): boolean {
    const attachments = message?.attachments;
    if (!attachments || !Array.isArray(attachments)) {
      return false;
    }

    return attachments.some((att: any) => 
      att?.file?.tree && att?.file?.vertex
    );
  }

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

describe('Simplified File Previews (Browser)', () => {
  let testSpace: MockSpace;
  let filesTree: MockAppTree;
  let fileVertex: MockVertex;
  let fileRef: FileReference;

  beforeEach(async () => {
    // Create mock space
    testSpace = new MockSpace('test-space-id');
    
    // Create files tree
    filesTree = await testSpace.newAppTree('files');
    const parentFolder = filesTree.tree.getVertexByPath('files');
    
    // Create a test file in the mock file store
    const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMBg9v2e0UAAAAASUVORK5CYII=';
    const testImageBytes = new Uint8Array(Buffer.from(testImageData, 'base64'));
    const put = await testSpace.getFileStore().putBytes(testImageBytes, 'image/png');

    // Create file vertex
    fileVertex = filesTree.tree.newVertex(parentFolder!.id, {
      _n: 'test-image.png',
      hash: put.hash,
      name: 'test-image.png',
      mimeType: 'image/png',
      size: put.size,
      width: 800,
      height: 600,
    });

    fileRef = {
      tree: filesTree.getId(),
      vertex: fileVertex.id,
    };

    // Set up mock client state
    mockClientState.currentSpace = testSpace;
  });

  describe('Simple Attachments', () => {
    it('should create simple attachments with file references', () => {
      const simpleAttachment: SimpleAttachment = {
        id: 'att1',
        kind: 'image',
        file: fileRef,
        alt: 'Test image',
      };

      expect(simpleAttachment.id).toBe('att1');
      expect(simpleAttachment.kind).toBe('image');
      expect(simpleAttachment.file.tree).toBe(filesTree.getId());
      expect(simpleAttachment.file.vertex).toBe(fileVertex.id);
      expect(simpleAttachment.alt).toBe('Test image');
    });

    it('should validate simple attachments correctly', () => {
      const validAttachment: SimpleAttachment = {
        id: 'att1',
        kind: 'image',
        file: fileRef,
      };

      const invalidAttachment = {
        id: 'att1',
        kind: 'image',
        // Missing file reference
      };

      expect(validAttachment.file?.tree).toBeTruthy();
      expect(validAttachment.file?.vertex).toBeTruthy();
      expect(invalidAttachment.file).toBeUndefined();
    });
  });

  describe('Utility Functions', () => {
    it('should extract file references from messages', () => {
      const message = {
        id: 'msg1',
        text: 'Hello',
        attachments: [
          {
            id: 'att1',
            kind: 'image',
            file: fileRef,
          },
          {
            id: 'att2',
            kind: 'text',
            file: { tree: 'other-tree', vertex: 'other-vertex' },
          },
        ],
      };

      const fileRefs = FilePreviewUtils.extractFileReferences(message);

      expect(fileRefs).toHaveLength(2);
      expect(fileRefs[0]).toEqual(fileRef);
      expect(fileRefs[1]).toEqual({ tree: 'other-tree', vertex: 'other-vertex' });
    });

    it('should check for file attachments in messages', () => {
      const messageWithFiles = {
        id: 'msg1',
        text: 'Hello',
        attachments: [
          {
            id: 'att1',
            kind: 'image',
            file: fileRef,
          },
        ],
      };

      const messageWithoutFiles = {
        id: 'msg2',
        text: 'Hello',
        attachments: [],
      };

      expect(FilePreviewUtils.hasFileAttachments(messageWithFiles)).toBe(true);
      expect(FilePreviewUtils.hasFileAttachments(messageWithoutFiles)).toBe(false);
    });

    it('should count file attachments in messages', () => {
      const message = {
        id: 'msg1',
        text: 'Hello',
        attachments: [
          {
            id: 'att1',
            kind: 'image',
            file: fileRef,
          },
          {
            id: 'att2',
            kind: 'text',
            file: { tree: 'other-tree', vertex: 'other-vertex' },
          },
          {
            id: 'att3',
            kind: 'text',
            content: 'Hello world',
            // No file reference
          },
        ],
      };

      const count = FilePreviewUtils.getFileAttachmentCount(message);

      expect(count).toBe(2);
    });
  });

  describe('File Reference Resolution', () => {
    it('should resolve file references to file information', async () => {
      const fileInfo = await MockClientFileResolver.resolveFileReference(fileRef);

      expect(fileInfo).toBeDefined();
      expect(fileInfo?.id).toBe(fileVertex.id);
      expect(fileInfo?.name).toBe('test-image.png');
      expect(fileInfo?.mimeType).toBe('image/png');
      expect(fileInfo?.size).toBe(68); // Size of our test image
      expect(fileInfo?.width).toBe(800);
      expect(fileInfo?.height).toBe(600);
      expect(fileInfo?.hash).toBe(fileVertex.getProperty('hash'));
      expect(fileInfo?.dataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('should handle missing file references gracefully', async () => {
      const missingFileRef: FileReference = {
        tree: 'non-existent-tree',
        vertex: 'non-existent-vertex',
      };

      const fileInfo = await MockClientFileResolver.resolveFileReference(missingFileRef);
      expect(fileInfo).toBeNull();
    });

    it('should resolve multiple file references', async () => {
      const fileRefs = [fileRef, { tree: 'other-tree', vertex: 'other-vertex' }];
      const fileInfos = await MockClientFileResolver.resolveFileReferences(fileRefs);

      expect(fileInfos).toHaveLength(1); // Only the valid one should resolve
      expect(fileInfos[0]?.id).toBe(fileVertex.id);
    });
  });

  describe('End-to-End Workflow', () => {
    it('should handle complete file preview workflow', async () => {
      // 1. Create a message with simple attachments
      const message = {
        id: 'msg1',
        text: 'Here is an image',
        attachments: [
          {
            id: 'att1',
            kind: 'image',
            file: fileRef,
          },
        ],
      };

      // 2. Extract file references
      const fileRefs = FilePreviewUtils.extractFileReferences(message);
      expect(fileRefs).toHaveLength(1);
      expect(fileRefs[0]).toEqual(fileRef);

      // 3. Resolve file references for preview
      const fileInfos = await MockClientFileResolver.resolveFileReferences(fileRefs);
      expect(fileInfos).toHaveLength(1);
      expect(fileInfos[0]?.name).toBe('test-image.png');
      expect(fileInfos[0]?.dataUrl).toMatch(/^data:image\/png;base64,/);

      // 4. Verify the complete workflow works
      expect(fileInfos[0]?.id).toBe(fileVertex.id);
      expect(fileInfos[0]?.mimeType).toBe('image/png');
      expect(fileInfos[0]?.width).toBe(800);
      expect(fileInfos[0]?.height).toBe(600);
    });
  });

  describe('Browser-Specific Features', () => {
    it('should work with browser file APIs', async () => {
      // Test that the system works with browser file handling
      const testFile = new File(['Hello World'], 'test.txt', { type: 'text/plain' });
      
      // Convert file to bytes
      const arrayBuffer = await testFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Store in mock file store
      const put = await testSpace.getFileStore().putBytes(bytes, 'text/plain');
      
      // Create file vertex
      const textFileVertex = filesTree.tree.newVertex('files', {
        _n: 'test.txt',
        hash: put.hash,
        name: 'test.txt',
        mimeType: 'text/plain',
        size: put.size,
      });

      const textFileRef: FileReference = {
        tree: filesTree.getId(),
        vertex: textFileVertex.id,
      };

      // Resolve the file reference
      const fileInfo = await MockClientFileResolver.resolveFileReference(textFileRef);
      
      expect(fileInfo).toBeDefined();
      expect(fileInfo?.name).toBe('test.txt');
      expect(fileInfo?.mimeType).toBe('text/plain');
      expect(fileInfo?.size).toBe(11); // "Hello World" length
    });

    it('should handle data URLs in browser environment', async () => {
      // Test data URL handling
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMBg9v2e0UAAAAASUVORK5CYII=';
      
      // Store data URL in mock file store
      const put = await testSpace.getFileStore().putDataUrl(dataUrl);
      
      // Create file vertex
      const dataUrlVertex = filesTree.tree.newVertex('files', {
        _n: 'data-url-image.png',
        hash: put.hash,
        name: 'data-url-image.png',
        mimeType: 'image/png',
        size: put.size,
      });

      const dataUrlFileRef: FileReference = {
        tree: filesTree.getId(),
        vertex: dataUrlVertex.id,
      };

      // Resolve the file reference
      const fileInfo = await MockClientFileResolver.resolveFileReference(dataUrlFileRef);
      
      expect(fileInfo).toBeDefined();
      expect(fileInfo?.name).toBe('data-url-image.png');
      expect(fileInfo?.mimeType).toBe('image/png');
      expect(fileInfo?.dataUrl).toMatch(/^data:image\/png;base64,/);
    });
  });
});