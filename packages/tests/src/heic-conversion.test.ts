import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm, readFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Space, SpaceManager, FileSystemPersistenceLayer, createFileStore, FilesTreeData } from '@sila/core';
import { NodeFileSystem } from './node-file-system';
import { NodeHeicConverter } from '@sila/client/utils/heicConverter';

// Node.js compatible versions of the utility functions for testing
function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // In Node.js, we'll create a simple data URL from the file buffer
    if (file.arrayBuffer) {
      file.arrayBuffer().then(buffer => {
        const base64 = Buffer.from(buffer).toString('base64');
        resolve(`data:${file.type};base64,${base64}`);
      }).catch(reject);
    } else {
      reject(new Error('File.arrayBuffer not available'));
    }
  });
}

function getImageDimensions(src: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    // For testing purposes, return mock dimensions
    // In a real implementation, you might use a Node.js image library
    resolve({ width: 100, height: 100 });
  });
}

// Node.js compatible version of optimizeImageSize for testing
async function optimizeImageSize(file: File): Promise<File> {
  // Only process image files
  if (!file.type.startsWith('image/')) {
    return file;
  }
  
  try {
    // Get image dimensions using our Node.js compatible function
    const dimensions = await getImageDimensions(await toDataUrl(file));
    if (!dimensions) return file;
    
    const { width, height } = dimensions;
    const maxSize = 2048;
    
    // Check if resizing is needed
    if (width <= maxSize && height <= maxSize) {
      return file; // No resizing needed
    }
    
    // For testing, just return the original file
    // In a real implementation, you would resize the image
    return file;
  } catch (error) {
    console.warn(`Image resizing failed for ${file.name}, using original:`, error);
    return file; // Fallback to original
  }
}

// Import the conversion functions but override the browser-specific ones
import { processFileForUpload } from '@sila/client/utils/fileProcessing';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('HEIC Conversion Pipeline', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'sila-heic-test-'));
  });

  afterAll(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should convert HEIC file to JPEG and store with metadata', async () => {
    const fs = new NodeFileSystem();

    const space = Space.newSpace(crypto.randomUUID());
    const spaceId = space.getId();
    space.name = 'HEIC Test Space';

    const layer = new FileSystemPersistenceLayer(tempDir, spaceId, fs);
    const manager = new SpaceManager();
    await manager.addNewSpace(space, [layer]);

    // Give time to ensure base structure is on disk
    await wait(600);

    // Create file store bound to this workspace path
    const fileStore = createFileStore({
      getSpaceRootPath: () => tempDir,
      getFs: () => fs
    });
    expect(fileStore).toBeTruthy();

    // Read the test HEIC file
    const heicFilePath = path.join(__dirname, '../assets/to-send/from-iphone.heic');
    const heicBuffer = await readFile(heicFilePath);
    
    // Create a File-like object for testing
    const heicFile = {
      name: 'from-iphone.heic',
      type: 'image/heic',
      size: heicBuffer.byteLength,
      arrayBuffer: () => Promise.resolve(heicBuffer.buffer.slice(heicBuffer.byteOffset, heicBuffer.byteOffset + heicBuffer.byteLength))
    } as File;

    // Test HEIC conversion pipeline
    const processedFile = await processFileForUpload(heicFile);
    expect(processedFile.type).toBe('image/jpeg');
    expect(processedFile.name).toBe('from-iphone.jpg'); // Extension changed to reflect conversion

    // Test image optimization
    const optimizedFile = await optimizeImageSize(processedFile);
    expect(optimizedFile.type).toBe('image/jpeg');

    // Convert to data URL and upload
    const dataUrl = await toDataUrl(optimizedFile);
    const put = await fileStore!.putDataUrl(dataUrl);
    expect(put.hash).toBeTruthy();
    expect(put.hash.length).toBe(64); // SHA-256 hex string length

    // Get image dimensions
    const dimensions = await getImageDimensions(dataUrl);
    expect(dimensions).toBeTruthy();
    expect(dimensions!.width).toBeGreaterThan(0);
    expect(dimensions!.height).toBeGreaterThan(0);

    // Create files tree and link file
    const filesTree = FilesTreeData.createNewFilesTree(space);
    const folder = FilesTreeData.ensureFolderPath(filesTree, ['heic-test']);
    
    const fileVertex = FilesTreeData.createOrLinkFile({
      filesTree,
      parentFolder: folder,
      name: processedFile.name, // Use the converted filename
      hash: put.hash,
      mimeType: optimizedFile.type,
      size: optimizedFile.size,
      width: dimensions!.width,
      height: dimensions!.height,
      originalFormat: 'image/heic',
      conversionQuality: 0.85,
      originalDimensions: undefined, // Would be set if resized
      originalFilename: heicFile.name // Store original filename
    });

    expect(fileVertex.getProperty('hash')).toBe(put.hash);
    expect(fileVertex.getProperty('mimeType')).toBe('image/jpeg');
    expect(fileVertex.getProperty('originalFormat')).toBe('image/heic');
    expect(fileVertex.getProperty('conversionQuality')).toBe(0.85);
    expect(fileVertex.getProperty('originalFilename')).toBe('from-iphone.heic');

    // Allow ops to be flushed
    await wait(1200);

    // Verify the converted file can be loaded back
    const loadedDataUrl = await fileStore!.getDataUrl(put.hash);
    console.log('Loaded data URL:', loadedDataUrl.substring(0, 100) + '...');
    expect(loadedDataUrl.startsWith('data:')).toBe(true);

    // Verify CAS path exists
    const casPath = path.join(tempDir, 'space-v1', 'files', 'sha256', put.hash.slice(0, 2), put.hash.slice(2));
    await access(casPath);
    const raw = await readFile(casPath);
    expect(raw.byteLength).toBeGreaterThan(0);
  });

  it('should handle deduplication of identical HEIC files', async () => {
    const fs = new NodeFileSystem();

    const space = Space.newSpace(crypto.randomUUID());
    const spaceId = space.getId();
    space.name = 'HEIC Deduplication Test Space';

    const layer = new FileSystemPersistenceLayer(tempDir, spaceId, fs);
    const manager = new SpaceManager();
    await manager.addNewSpace(space, [layer]);

    await wait(600);

    const fileStore = createFileStore({
      getSpaceRootPath: () => tempDir,
      getFs: () => fs
    });

    // Read the test HEIC file
    const heicFilePath = path.join(__dirname, '../assets/to-send/from-iphone.heic');
    const heicBuffer = await readFile(heicFilePath);
    
    // Create two identical HEIC files
    const heicFile1 = {
      name: 'from-iphone-1.heic',
      type: 'image/heic',
      size: heicBuffer.byteLength,
      arrayBuffer: () => Promise.resolve(heicBuffer.buffer.slice(heicBuffer.byteOffset, heicBuffer.byteOffset + heicBuffer.byteLength))
    } as File;

    const heicFile2 = {
      name: 'from-iphone-2.heic',
      type: 'image/heic',
      size: heicBuffer.byteLength,
      arrayBuffer: () => Promise.resolve(heicBuffer.buffer.slice(heicBuffer.byteOffset, heicBuffer.byteOffset + heicBuffer.byteLength))
    } as File;

    // Process both files through the conversion pipeline
    const processedFile1 = await processFileForUpload(heicFile1);
    const processedFile2 = await processFileForUpload(heicFile2);

    // Upload both
    const dataUrl1 = await toDataUrl(processedFile1);
    const dataUrl2 = await toDataUrl(processedFile2);
    
    const put1 = await fileStore!.putDataUrl(dataUrl1);
    const put2 = await fileStore!.putDataUrl(dataUrl2);

    // Should have the same hash due to deduplication
    expect(put1.hash).toBe(put2.hash);

    // Create files tree
    const filesTree = FilesTreeData.createNewFilesTree(space);
    const folder = FilesTreeData.ensureFolderPath(filesTree, ['dedup-test']);
    
    // Create two file vertices with different names but same hash
    const fileVertex1 = FilesTreeData.createOrLinkFile({
      filesTree,
      parentFolder: folder,
      name: processedFile1.name, // Use converted filename
      hash: put1.hash,
      mimeType: processedFile1.type,
      size: processedFile1.size,
      originalFormat: 'image/heic',
      originalFilename: heicFile1.name
    });

    const fileVertex2 = FilesTreeData.createOrLinkFile({
      filesTree,
      parentFolder: folder,
      name: processedFile2.name, // Use converted filename
      hash: put2.hash,
      mimeType: processedFile2.type,
      size: processedFile2.size,
      originalFormat: 'image/heic',
      originalFilename: heicFile2.name
    });

    // Should be the same vertex due to deduplication
    expect(fileVertex1.id).toBe(fileVertex2.id);
  });

  it('should handle non-HEIC files without conversion', async () => {
    const fs = new NodeFileSystem();

    const space = Space.newSpace(crypto.randomUUID());
    const spaceId = space.getId();
    space.name = 'Non-HEIC Test Space';

    const layer = new FileSystemPersistenceLayer(tempDir, spaceId, fs);
    const manager = new SpaceManager();
    await manager.addNewSpace(space, [layer]);

    await wait(600);

    const fileStore = createFileStore({
      getSpaceRootPath: () => tempDir,
      getFs: () => fs
    });

    // Create a simple PNG file
    const pngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMBg9v2e0UAAAAASUVORK5CYII=';
    const pngBuffer = Buffer.from(pngDataUrl.split(',')[1]!, 'base64');
    
    const pngFile = {
      name: 'test.png',
      type: 'image/png',
      size: pngBuffer.byteLength,
      arrayBuffer: () => Promise.resolve(pngBuffer.buffer.slice(pngBuffer.byteOffset, pngBuffer.byteOffset + pngBuffer.byteLength))
    } as File;

    // Process the PNG file through the pipeline (should not be converted)
    const processedFile = await processFileForUpload(pngFile);
    expect(processedFile.type).toBe('image/png'); // Should remain PNG
    expect(processedFile.name).toBe('test.png');

    // Upload
    const dataUrl = await toDataUrl(processedFile);
    const put = await fileStore!.putDataUrl(dataUrl);

    // Create files tree
    const filesTree = FilesTreeData.createNewFilesTree(space);
    const folder = FilesTreeData.ensureFolderPath(filesTree, ['png-test']);
    
    const fileVertex = FilesTreeData.createOrLinkFile({
      filesTree,
      parentFolder: folder,
      name: pngFile.name,
      hash: put.hash,
      mimeType: processedFile.type,
      size: processedFile.size
    });

    expect(fileVertex.getProperty('mimeType')).toBe('image/png');
    expect(fileVertex.getProperty('originalFormat')).toBeUndefined(); // No conversion
  });
});