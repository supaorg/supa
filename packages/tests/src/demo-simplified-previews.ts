#!/usr/bin/env tsx

/**
 * Demo script for testing the simplified file preview system
 * This can be run without Electron to test the core functionality
 */

import { Space, SpaceManager, FileSystemPersistenceLayer, createFileStore, FilesTreeData } from '@sila/core';
import { NodeFileSystem } from './node-file-system';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { FileReference } from '@sila/core/spaces/files/FileResolver';

// Simple attachment types for demo
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

// Migration utilities for demo
class AttachmentMigration {
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

  static toLegacyAttachments(simpleAttachments: SimpleAttachment[]): LegacyAttachment[] {
    return simpleAttachments.map(att => ({
      id: att.id,
      kind: att.kind,
      file: att.file,
      alt: att.alt,
    }));
  }

  static canMigrateMessage(message: any): boolean {
    const attachments = message?.attachments;
    if (!attachments || !Array.isArray(attachments)) {
      return true;
    }
    return attachments.every((att: any) => 
      att?.file?.tree && att?.file?.vertex
    );
  }

  static migrateMessage(message: any): any {
    if (!this.canMigrateMessage(message)) {
      return message;
    }

    const attachments = message?.attachments;
    if (!attachments || !Array.isArray(attachments)) {
      return message;
    }

    const simpleAttachments = this.toSimpleAttachments(attachments);
    
    return {
      ...message,
      attachments: simpleAttachments,
    };
  }

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

// File resolver for demo
class DemoFileResolver {
  constructor(private space: Space) {}

  async resolveFileReference(fileRef: FileReference) {
    try {
      const filesTree = await this.space.loadAppTree(fileRef.tree);
      if (!filesTree) {
        console.warn(`Files tree not found: ${fileRef.tree}`);
        return null;
      }

      const fileVertex = filesTree.tree.getVertex(fileRef.vertex);
      if (!fileVertex) {
        console.warn(`File vertex not found: ${fileRef.vertex}`);
        return null;
      }

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

      const fileStore = this.space.getFileStore();
      if (!fileStore) {
        console.warn('FileStore not available for resolving file references');
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

  async resolveFileReferences(fileRefs: FileReference[]) {
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

async function runDemo() {
  console.log('🚀 Starting Simplified File Previews Demo\n');

  let tempDir: string;
  let spaceManager: SpaceManager;
  let testSpace: Space;
  let filesTree: any;
  let fileVertex: any;
  let fileRef: FileReference;

  try {
    // Create temporary directory
    tempDir = await mkdtemp(path.join(tmpdir(), 'sila-demo-'));
    console.log(`📁 Created temporary directory: ${tempDir}`);
    
    // Create space manager and test space
    spaceManager = new SpaceManager();
    testSpace = Space.newSpace(crypto.randomUUID());
    testSpace.name = 'Simplified File Previews Demo Space';

    // Create file system persistence layer
    const fs = new NodeFileSystem();
    const layer = new FileSystemPersistenceLayer(tempDir, testSpace.getId(), fs);
    await spaceManager.addNewSpace(testSpace, [layer]);

    // Wait for persistence to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Space created and persisted');

    // Create files tree
    filesTree = await testSpace.newAppTree('files');
    const parentFolder = filesTree.tree.getVertexByPath('files');
    console.log('📂 Files tree created');
    
    // Create file store
    const fileStore = createFileStore({
      getSpaceRootPath: () => tempDir,
      getFs: () => fs
    });

    // Create a test file in CAS
    const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMBg9v2e0UAAAAASUVORK5CYII=';
    const testImageBytes = Buffer.from(testImageData, 'base64');
    const put = await fileStore!.putBytes(testImageBytes, 'image/png');
    console.log(`💾 Test image stored in CAS with hash: ${put.hash}`);

    // Create file vertex
    fileVertex = filesTree.tree.newVertex(parentFolder.id, {
      _n: 'demo-image.png',
      hash: put.hash,
      name: 'demo-image.png',
      mimeType: 'image/png',
      size: put.size,
      width: 800,
      height: 600,
    });

    fileRef = {
      tree: filesTree.getId(),
      vertex: fileVertex.id,
    };
    console.log(`📄 File vertex created: ${fileVertex.id}`);

    // Demo 1: Simple Attachments
    console.log('\n📋 Demo 1: Simple Attachments');
    const simpleAttachment: SimpleAttachment = {
      id: 'att1',
      kind: 'image',
      file: fileRef,
      alt: 'Demo image',
    };
    console.log('Simple attachment created:', {
      id: simpleAttachment.id,
      kind: simpleAttachment.kind,
      file: simpleAttachment.file,
      alt: simpleAttachment.alt,
    });

    // Demo 2: Migration from Legacy
    console.log('\n🔄 Demo 2: Migration from Legacy Attachments');
    const legacyMessage = {
      id: 'msg1',
      text: 'Here is an image',
      attachments: [
        {
          id: 'att1',
          kind: 'image',
          name: 'demo.png',
          mimeType: 'image/png',
          size: 1024,
          dataUrl: 'data:image/png;base64,test',
          file: fileRef,
        },
        {
          id: 'att2',
          kind: 'text',
          name: 'demo.txt',
          content: 'Hello world',
          // No file reference - should be filtered out
        },
      ],
    };

    console.log('Original message attachments:', legacyMessage.attachments.length);
    console.log('Can migrate:', AttachmentMigration.canMigrateMessage(legacyMessage));

    const migratedMessage = AttachmentMigration.migrateMessage(legacyMessage);
    console.log('Migrated message attachments:', migratedMessage.attachments.length);
    console.log('File references extracted:', AttachmentMigration.extractFileReferences(migratedMessage).length);

    // Demo 3: File Resolution
    console.log('\n🔍 Demo 3: File Reference Resolution');
    const fileResolver = new DemoFileResolver(testSpace);
    const fileInfo = await fileResolver.resolveFileReference(fileRef);
    
    if (fileInfo) {
      console.log('File resolved successfully:');
      console.log(`  Name: ${fileInfo.name}`);
      console.log(`  MIME Type: ${fileInfo.mimeType}`);
      console.log(`  Size: ${fileInfo.size} bytes`);
      console.log(`  Dimensions: ${fileInfo.width}x${fileInfo.height}`);
      console.log(`  Data URL: ${fileInfo.dataUrl.substring(0, 50)}...`);
    } else {
      console.log('❌ Failed to resolve file reference');
    }

    // Demo 4: End-to-End Workflow
    console.log('\n🔄 Demo 4: End-to-End Workflow');
    const fileRefs = AttachmentMigration.extractFileReferences(migratedMessage);
    const resolvedFiles = await fileResolver.resolveFileReferences(fileRefs);
    
    console.log(`Resolved ${resolvedFiles.length} files from ${fileRefs.length} references`);
    resolvedFiles.forEach((file, index) => {
      console.log(`  File ${index + 1}: ${file.name} (${file.mimeType})`);
    });

    // Demo 5: Payload Size Comparison
    console.log('\n📊 Demo 5: Payload Size Comparison');
    const legacyPayload = JSON.stringify(legacyMessage.attachments);
    const simplePayload = JSON.stringify(migratedMessage.attachments);
    
    console.log(`Legacy payload size: ${legacyPayload.length} bytes`);
    console.log(`Simple payload size: ${simplePayload.length} bytes`);
    console.log(`Size reduction: ${((1 - simplePayload.length / legacyPayload.length) * 100).toFixed(1)}%`);

    console.log('\n✅ Demo completed successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    // Clean up
    if (tempDir) {
      try {
        await rm(tempDir, { recursive: true, force: true });
        console.log('\n🧹 Temporary directory cleaned up');
      } catch (error) {
        console.warn('⚠️ Failed to clean up temporary directory:', error);
      }
    }
    if (spaceManager && testSpace) {
      try {
        await spaceManager.closeSpace(testSpace.getId());
        console.log('🔒 Space closed');
      } catch (error) {
        console.warn('⚠️ Failed to close space:', error);
      }
    }
  }
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}

export { runDemo };