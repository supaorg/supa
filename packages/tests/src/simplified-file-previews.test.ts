import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SpaceManager } from '@sila/core';
import { createTestSpace } from './testUtils';
import { ClientFileResolver } from '@sila/client/utils/fileResolver';
import { AttachmentMigration } from '@sila/client/utils/attachmentMigration';
import type { SimpleAttachment, LegacyAttachment } from '@sila/client/types/attachments';
import type { FileReference } from '@sila/core/spaces/files/FileResolver';

describe('Simplified File Previews', () => {
  let spaceManager: SpaceManager;
  let testSpace: any;
  let filesTree: any;
  let fileVertex: any;
  let fileRef: FileReference;

  beforeEach(async () => {
    spaceManager = new SpaceManager();
    testSpace = await createTestSpace(spaceManager, 'simplified-file-previews');
    
    // Create a files tree and add a test file
    filesTree = await testSpace.newAppTree('files');
    const parentFolder = filesTree.tree.getVertexByPath('files');
    
    // Create a test file vertex
    fileVertex = filesTree.tree.newVertex(parentFolder.id, {
      _n: 'test-image.png',
      hash: 'test-hash-123',
      name: 'test-image.png',
      mimeType: 'image/png',
      size: 1024,
      width: 800,
      height: 600,
    });

    fileRef = {
      tree: filesTree.getId(),
      vertex: fileVertex.id,
    };
  });

  afterEach(async () => {
    await spaceManager.closeSpace(testSpace.id);
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

      expect(AttachmentMigration.isSimpleAttachment(validAttachment)).toBe(true);
      expect(AttachmentMigration.isSimpleAttachment(invalidAttachment)).toBe(false);
    });
  });

  describe('Migration Utilities', () => {
    it('should convert legacy attachments to simple attachments', () => {
      const legacyAttachments: LegacyAttachment[] = [
        {
          id: 'att1',
          kind: 'image',
          name: 'test.png',
          mimeType: 'image/png',
          size: 1024,
          dataUrl: 'data:image/png;base64,test',
          file: fileRef,
        },
        {
          id: 'att2',
          kind: 'text',
          name: 'test.txt',
          content: 'Hello world',
          // No file reference - should be filtered out
        },
      ];

      const simpleAttachments = AttachmentMigration.toSimpleAttachments(legacyAttachments);

      expect(simpleAttachments).toHaveLength(1);
      expect(simpleAttachments[0].id).toBe('att1');
      expect(simpleAttachments[0].kind).toBe('image');
      expect(simpleAttachments[0].file).toEqual(fileRef);
    });

    it('should convert simple attachments back to legacy format', () => {
      const simpleAttachments: SimpleAttachment[] = [
        {
          id: 'att1',
          kind: 'image',
          file: fileRef,
          alt: 'Test image',
        },
      ];

      const legacyAttachments = AttachmentMigration.toLegacyAttachments(simpleAttachments);

      expect(legacyAttachments).toHaveLength(1);
      expect(legacyAttachments[0].id).toBe('att1');
      expect(legacyAttachments[0].kind).toBe('image');
      expect(legacyAttachments[0].file).toEqual(fileRef);
      expect(legacyAttachments[0].alt).toBe('Test image');
    });

    it('should create simple attachments using helper function', () => {
      const simpleAttachment = AttachmentMigration.createSimpleAttachment(
        'att1',
        'image',
        fileRef,
        'Test image'
      );

      expect(simpleAttachment.id).toBe('att1');
      expect(simpleAttachment.kind).toBe('image');
      expect(simpleAttachment.file).toEqual(fileRef);
      expect(simpleAttachment.alt).toBe('Test image');
    });
  });

  describe('Message Migration', () => {
    it('should check if message can be migrated', () => {
      const migratableMessage = {
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

      const nonMigratableMessage = {
        id: 'msg2',
        text: 'Hello',
        attachments: [
          {
            id: 'att1',
            kind: 'image',
            dataUrl: 'data:image/png;base64,test',
            // No file reference
          },
        ],
      };

      expect(AttachmentMigration.canMigrateMessage(migratableMessage)).toBe(true);
      expect(AttachmentMigration.canMigrateMessage(nonMigratableMessage)).toBe(false);
    });

    it('should migrate messages to use simple attachments', () => {
      const originalMessage = {
        id: 'msg1',
        text: 'Hello',
        attachments: [
          {
            id: 'att1',
            kind: 'image',
            name: 'test.png',
            mimeType: 'image/png',
            size: 1024,
            dataUrl: 'data:image/png;base64,test',
            file: fileRef,
          },
        ],
      };

      const migratedMessage = AttachmentMigration.migrateMessage(originalMessage);

      expect(migratedMessage.id).toBe('msg1');
      expect(migratedMessage.text).toBe('Hello');
      expect(migratedMessage.attachments).toHaveLength(1);
      expect(migratedMessage.attachments[0].id).toBe('att1');
      expect(migratedMessage.attachments[0].kind).toBe('image');
      expect(migratedMessage.attachments[0].file).toEqual(fileRef);
      // Legacy properties should be removed
      expect(migratedMessage.attachments[0].name).toBeUndefined();
      expect(migratedMessage.attachments[0].dataUrl).toBeUndefined();
    });

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

      const fileRefs = AttachmentMigration.extractFileReferences(message);

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

      expect(AttachmentMigration.hasFileAttachments(messageWithFiles)).toBe(true);
      expect(AttachmentMigration.hasFileAttachments(messageWithoutFiles)).toBe(false);
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

      const count = AttachmentMigration.getFileAttachmentCount(message);

      expect(count).toBe(2);
    });
  });

  describe('File Reference Resolution', () => {
    it('should resolve file references to file information', async () => {
      // Mock the client state to return our test space
      const mockClientState = {
        currentSpace: testSpace,
      };

      // Mock the ClientFileResolver to use our test space
      const originalResolver = ClientFileResolver.resolveFileReference;
      ClientFileResolver.resolveFileReference = async (fileRef: FileReference) => {
        const filesTree = await testSpace.loadAppTree(fileRef.tree);
        const fileVertex = filesTree.tree.getVertex(fileRef.vertex);
        
        return {
          id: fileVertex.id,
          name: fileVertex.getProperty('name'),
          mimeType: fileVertex.getProperty('mimeType'),
          size: fileVertex.getProperty('size'),
          width: fileVertex.getProperty('width'),
          height: fileVertex.getProperty('height'),
          dataUrl: 'data:image/png;base64,mock-data',
          hash: fileVertex.getProperty('hash'),
        };
      };

      try {
        const fileInfo = await ClientFileResolver.resolveFileReference(fileRef);

        expect(fileInfo).toBeDefined();
        expect(fileInfo?.id).toBe(fileVertex.id);
        expect(fileInfo?.name).toBe('test-image.png');
        expect(fileInfo?.mimeType).toBe('image/png');
        expect(fileInfo?.size).toBe(1024);
        expect(fileInfo?.width).toBe(800);
        expect(fileInfo?.height).toBe(600);
        expect(fileInfo?.hash).toBe('test-hash-123');
      } finally {
        // Restore original function
        ClientFileResolver.resolveFileReference = originalResolver;
      }
    });

    it('should handle missing file references gracefully', async () => {
      const missingFileRef: FileReference = {
        tree: 'non-existent-tree',
        vertex: 'non-existent-vertex',
      };

      // Mock the ClientFileResolver to return null for missing files
      const originalResolver = ClientFileResolver.resolveFileReference;
      ClientFileResolver.resolveFileReference = async () => null;

      try {
        const fileInfo = await ClientFileResolver.resolveFileReference(missingFileRef);
        expect(fileInfo).toBeNull();
      } finally {
        ClientFileResolver.resolveFileReference = originalResolver;
      }
    });
  });
});