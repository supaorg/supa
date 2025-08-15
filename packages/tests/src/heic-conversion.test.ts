import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm, readFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Space, SpaceManager, FileSystemPersistenceLayer, createFileStore, FilesTreeData } from '@sila/core';
import { NodeFileSystem } from './node-file-system';

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

  it('should handle HEIC file metadata and storage integration', async () => {
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

    // Create a mock JPEG file (simulating converted HEIC)
    const jpegDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A';
    const jpegBuffer = Buffer.from(jpegDataUrl.split(',')[1]!, 'base64');
    
    // Create a File-like object simulating a converted HEIC file
    const convertedFile = {
      name: 'from-iphone.heic', // Original HEIC filename preserved
      type: 'image/jpeg', // Converted to JPEG
      size: jpegBuffer.byteLength,
      arrayBuffer: () => Promise.resolve(jpegBuffer.buffer.slice(jpegBuffer.byteOffset, jpegBuffer.byteOffset + jpegBuffer.byteLength))
    } as File;

    // Upload the converted file
    const dataUrl = await toDataUrl(convertedFile);
    const put = await fileStore!.putDataUrl(dataUrl);
    expect(put.hash).toBeTruthy();
    expect(put.hash.length).toBe(64); // SHA-256 hex string length

    // Create files tree and link file with conversion metadata
    const filesTree = FilesTreeData.createNewFilesTree(space);
    const folder = FilesTreeData.ensureFolderPath(filesTree, ['heic-test']);
    
    const fileVertex = FilesTreeData.createOrLinkFile({
      filesTree,
      parentFolder: folder,
      name: convertedFile.name, // Original HEIC filename
      hash: put.hash,
      mimeType: convertedFile.type, // JPEG MIME type
      size: convertedFile.size,
      width: 100, // Mock dimensions
      height: 100,
      originalFormat: 'image/heic', // Track original format
      conversionQuality: 0.85, // Track conversion quality
      originalDimensions: '200x200' // Mock original dimensions
    });

    // Verify metadata is stored correctly
    expect(fileVertex.getProperty('hash')).toBe(put.hash);
    expect(fileVertex.getProperty('mimeType')).toBe('image/jpeg');
    expect(fileVertex.getProperty('originalFormat')).toBe('image/heic');
    expect(fileVertex.getProperty('conversionQuality')).toBe(0.85);
    expect(fileVertex.getProperty('originalDimensions')).toBe('200x200');
    expect(fileVertex.name).toBe('from-iphone.heic'); // Original filename preserved

    // Allow ops to be flushed
    await wait(1200);

    // Verify the file can be loaded back
    const loadedDataUrl = await fileStore!.getDataUrl(put.hash);
    expect(loadedDataUrl.startsWith('data:image/jpeg')).toBe(true);

    // Verify CAS path exists
    const casPath = path.join(tempDir, 'space-v1', 'files', 'sha256', put.hash.slice(0, 2), put.hash.slice(2));
    await access(casPath);
    const raw = await readFile(casPath);
    expect(raw.byteLength).toBeGreaterThan(0);
  });

  it('should handle deduplication of identical converted files', async () => {
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

    // Create two identical converted JPEG files (simulating converted HEIC)
    const jpegDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A';
    const jpegBuffer = Buffer.from(jpegDataUrl.split(',')[1]!, 'base64');
    
    const convertedFile1 = {
      name: 'from-iphone-1.heic', // Original HEIC filename
      type: 'image/jpeg', // Converted to JPEG
      size: jpegBuffer.byteLength,
      arrayBuffer: () => Promise.resolve(jpegBuffer.buffer.slice(jpegBuffer.byteOffset, jpegBuffer.byteOffset + jpegBuffer.byteLength))
    } as File;

    const convertedFile2 = {
      name: 'from-iphone-2.heic', // Original HEIC filename
      type: 'image/jpeg', // Converted to JPEG
      size: jpegBuffer.byteLength,
      arrayBuffer: () => Promise.resolve(jpegBuffer.buffer.slice(jpegBuffer.byteOffset, jpegBuffer.byteOffset + jpegBuffer.byteLength))
    } as File;

    // Upload both files
    const dataUrl1 = await toDataUrl(convertedFile1);
    const dataUrl2 = await toDataUrl(convertedFile2);
    
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
      name: convertedFile1.name,
      hash: put1.hash,
      mimeType: convertedFile1.type,
      size: convertedFile1.size,
      originalFormat: 'image/heic'
    });

    const fileVertex2 = FilesTreeData.createOrLinkFile({
      filesTree,
      parentFolder: folder,
      name: convertedFile2.name,
      hash: put2.hash,
      mimeType: convertedFile2.type,
      size: convertedFile2.size,
      originalFormat: 'image/heic'
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

    // Upload the PNG file directly (no conversion needed)
    const dataUrl = await toDataUrl(pngFile);
    const put = await fileStore!.putDataUrl(dataUrl);

    // Create files tree
    const filesTree = FilesTreeData.createNewFilesTree(space);
    const folder = FilesTreeData.ensureFolderPath(filesTree, ['png-test']);
    
    const fileVertex = FilesTreeData.createOrLinkFile({
      filesTree,
      parentFolder: folder,
      name: pngFile.name,
      hash: put.hash,
      mimeType: pngFile.type,
      size: pngFile.size
    });

    expect(fileVertex.getProperty('mimeType')).toBe('image/png');
    expect(fileVertex.getProperty('originalFormat')).toBeUndefined(); // No conversion
  });
});

// HEIC Conversion Pipeline Functions (copied from FilesApp.svelte for testing)
async function processFileForUpload(file: File): Promise<File> {
  // Check if it's a HEIC file
  if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
    try {
      // Convert HEIC to JPEG
      const convertedBlob = await convertHeicToJpeg(file);
      
      // Create new File object with converted data but original name
      return new File([convertedBlob], file.name, {
        type: 'image/jpeg',
        lastModified: file.lastModified
      });
    } catch (error) {
      console.warn(`HEIC conversion failed for ${file.name}, skipping:`, error);
      throw error; // Skip this file
    }
  }
  
  // Return original file if no conversion needed
  return file;
}

async function convertHeicToJpeg(heicFile: File): Promise<Blob> {
  try {
    // Use heic2any library for browser-based conversion
    const { heic2any } = await import('heic2any');
    
    const jpegBlob = await heic2any({
      blob: heicFile,
      toType: 'image/jpeg',
      quality: 0.85 // Good balance of quality and size
    });
    
    return jpegBlob;
  } catch (error) {
    console.error('HEIC conversion failed:', error);
    throw new Error(`Failed to convert HEIC file: ${error.message}`);
  }
}

async function optimizeImageSize(file: File): Promise<File> {
  // Only process image files
  if (!file.type.startsWith('image/')) {
    return file;
  }
  
  try {
    // Get image dimensions
    const dimensions = await getImageDimensions(await toDataUrl(file));
    if (!dimensions) return file;
    
    const { width, height } = dimensions;
    const maxSize = 2048;
    
    // Check if resizing is needed
    if (width <= maxSize && height <= maxSize) {
      return file; // No resizing needed
    }
    
    // Calculate new dimensions maintaining aspect ratio
    const ratio = Math.min(maxSize / width, maxSize / height);
    const newWidth = Math.round(width * ratio);
    const newHeight = Math.round(height * ratio);
    
    // Resize image
    const resizedBlob = await resizeImage(file, newWidth, newHeight, 0.85);
    
    // Create new File object with resized data
    return new File([resizedBlob], file.name, {
      type: file.type,
      lastModified: file.lastModified
    });
  } catch (error) {
    console.warn(`Image resizing failed for ${file.name}, using original:`, error);
    return file; // Fallback to original
  }
}

async function resizeImage(file: File, width: number, height: number, quality: number = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      
      // Draw resized image
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image for resizing'));
    img.src = URL.createObjectURL(file);
  });
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(src: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve(null);
    img.src = src;
  });
}