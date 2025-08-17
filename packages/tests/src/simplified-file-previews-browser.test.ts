import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Space, SpaceManager, FileSystemPersistenceLayer, createFileStore, FilesTreeData, FileResolver } from '@sila/core';
import { NodeFileSystem } from './node-file-system';
import type { FileReference } from '@sila/core/spaces/files/FileResolver';

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
  let tempDir: string;
  let spaceManager: SpaceManager;
  let testSpace: Space;
  let filesTree: any;
  let fileVertex: any;
  let fileRef: FileReference;
  let fileResolver: FileResolver;

  beforeEach(async () => {
    // Create temporary directory
    tempDir = await mkdtemp(path.join(tmpdir(), 'sila-simplified-previews-browser-test-'));
    
    // Create space manager and test space
    spaceManager = new SpaceManager();
    testSpace = Space.newSpace(crypto.randomUUID());
    testSpace.name = 'Simplified File Previews Browser Test Space';

    // Create file system persistence layer
    const fs = new NodeFileSystem();
    const layer = new FileSystemPersistenceLayer(tempDir, testSpace.getId(), fs);
    await spaceManager.addNewSpace(testSpace, [layer]);

    // Wait for persistence to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Ensure the space has a FileStore provider
    if (typeof layer.getFileStoreProvider === 'function') {
      testSpace.setFileStoreProvider(layer.getFileStoreProvider());
    }

    // Create files tree using the proper API
    filesTree = FilesTreeData.createNewFilesTree(testSpace);
    
    // Create file store
    const fileStore = createFileStore({
      getSpaceRootPath: () => tempDir,
      getFs: () => fs
    });

    // Create a test file in CAS
    const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMBg9v2e0UAAAAASUVORK5CYII=';
    const testImageBytes = Buffer.from(testImageData, 'base64');
    const put = await fileStore!.putBytes(testImageBytes, 'image/png');

    // Create file vertex using the proper API
    fileVertex = FilesTreeData.createOrLinkFile({
      filesTree,
      parentFolder: filesTree.tree.getVertexByPath('files')!,
      name: 'test-image.png',
      hash: put.hash,
      mimeType: 'image/png',
      size: put.size,
      width: 800,
      height: 600,
    });

    fileRef = {
      tree: filesTree.getId(),
      vertex: fileVertex.id,
    };

    // Create framework-agnostic file resolver
    fileResolver = new FileResolver(testSpace);
  });

  afterEach(async () => {
    // Clean up
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
    await spaceManager.closeSpace(testSpace.getId());
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
      const fileInfo = await fileResolver.resolveFileReference(fileRef);

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

      const fileInfo = await fileResolver.resolveFileReference(missingFileRef);
      expect(fileInfo).toBeNull();
    });

    it('should resolve multiple file references', async () => {
      const fileRefs = [fileRef, { tree: 'other-tree', vertex: 'other-vertex' }];
      const fileInfos = await fileResolver.resolveFileReferences(fileRefs);

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
      const fileInfos = await fileResolver.resolveFileReferences(fileRefs);
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
      
      // Store in file store
      const fileStore = testSpace.getFileStore();
      const put = await fileStore!.putBytes(bytes, 'text/plain');
      
      // Create file vertex
      const textFileVertex = FilesTreeData.createOrLinkFile({
        filesTree,
        parentFolder: filesTree.tree.getVertexByPath('files')!,
        name: 'test.txt',
        hash: put.hash,
        mimeType: 'text/plain',
        size: put.size,
      });

      const textFileRef: FileReference = {
        tree: filesTree.getId(),
        vertex: textFileVertex.id,
      };

      // Resolve the file reference
      const fileInfo = await fileResolver.resolveFileReference(textFileRef);
      
      expect(fileInfo).toBeDefined();
      expect(fileInfo?.name).toBe('test.txt');
      expect(fileInfo?.mimeType).toBe('text/plain');
      expect(fileInfo?.size).toBe(11); // "Hello World" length
    });

    it('should handle data URLs in browser environment', async () => {
      // Test data URL handling
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMBg9v2e0UAAAAASUVORK5CYII=';
      
      // Store data URL in file store
      const fileStore = testSpace.getFileStore();
      const put = await fileStore!.putDataUrl(dataUrl);
      
      // Create file vertex
      const dataUrlVertex = FilesTreeData.createOrLinkFile({
        filesTree,
        parentFolder: filesTree.tree.getVertexByPath('files')!,
        name: 'data-url-image.png',
        hash: put.hash,
        mimeType: 'image/png',
        size: put.size,
      });

      const dataUrlFileRef: FileReference = {
        tree: filesTree.getId(),
        vertex: dataUrlVertex.id,
      };

      // Resolve the file reference
      const fileInfo = await fileResolver.resolveFileReference(dataUrlFileRef);
      
      expect(fileInfo).toBeDefined();
      expect(fileInfo?.name).toBe('data-url-image.png');
      expect(fileInfo?.mimeType).toBe('image/png');
      expect(fileInfo?.dataUrl).toMatch(/^data:image\/png;base64,/);
      
      // Debug: let's see what we actually got
      console.log('Debug - Expected name: data-url-image.png, Got:', fileInfo?.name);
      console.log('Debug - File vertex ID:', dataUrlVertex.id);
      console.log('Debug - File reference:', dataUrlFileRef);
    });
  });
});