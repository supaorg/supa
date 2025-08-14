import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Space, SpaceManager, FileSystemPersistenceLayer, createFileStore, FilesTreeData } from '@sila/core';
import { NodeFileSystem } from './node-file-system';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const urls = [
  // Small thumbnails hosted by Wikimedia (keep sizes tiny)
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/June_odd-eyed-cat_cropped.jpg/120px-June_odd-eyed-cat_cropped.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Oak_Tree_-_geograph.org.uk_-_395141.jpg/120px-Oak_Tree_-_geograph.org.uk_-_395141.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Gull_portrait_ca_usa.jpg/120px-Gull_portrait_ca_usa.jpg'
];

function fromBase64(b64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }
  const str = atob(b64);
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i);
  return out;
}

function buffersEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  for (let i = 0; i < a.byteLength; i++) if (a[i] !== b[i]) return false;
  return true;
}

describe('Real files from the internet persisted in workspace CAS', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'sila-realfiles-test-'));
  });

  afterAll(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('downloads a few real images, writes to CAS, and verifies roundtrip', async () => {
    const fs = new NodeFileSystem();
    const space = Space.newSpace(crypto.randomUUID());
    const spaceId = space.getId();

    const layer = new FileSystemPersistenceLayer(tempDir, spaceId, fs);
    const manager = new SpaceManager();
    await manager.addNewSpace(space, [layer]);

    // Ensure base structure
    await wait(500);
    await access(path.join(tempDir, 'space-v1', 'ops'));

    const fileStore = createFileStore({ getSpaceRootPath: () => tempDir, getFs: () => fs });
    if (!fileStore) {
      throw new Error('FileStore not available');
    }

    // Try to fetch all URLs; if offline, skip the test gracefully
    const fetched: Array<{ url: string; bytes: Uint8Array; mime?: string }> = [];
    for (const u of urls) {
      try {
        const res = await fetch(u);
        if (!res.ok) continue;
        const mime = res.headers.get('content-type') || undefined;
        const ab = await res.arrayBuffer();
        const bytes = new Uint8Array(ab);
        if (bytes.byteLength > 0) {
          fetched.push({ url: u, bytes, mime });
        }
      } catch (e) {
        // ignore network errors per URL
      }
    }

    if (fetched.length === 0) {
      // no network; skip rest
      return;
    }

    const filesTree = FilesTreeData.createNewFilesTree(space);
    const now = new Date();
    const folder = FilesTreeData.ensureFolderPath(filesTree, [
      now.getUTCFullYear().toString(),
      String(now.getUTCMonth() + 1).padStart(2, '0'),
      String(now.getUTCDate()).padStart(2, '0'),
      'wikipedia'
    ]);

    for (const f of fetched) {
      const put = await fileStore.putBytes(f.bytes, f.mime);
      expect(put.fileId.startsWith('sha256:')).toBe(true);

      // Verify file exists in CAS
      const hash = put.fileId.slice('sha256:'.length);
      const casPath = path.join(tempDir, 'space-v1', 'files', 'sha256', hash.slice(0, 2), hash.slice(2) + '.bin');
      await access(casPath);

      // Verify bytes roundtrip
      const loadedBytes = await fileStore.getBytes(put.fileId);
      expect(buffersEqual(loadedBytes, f.bytes)).toBe(true);

      // Verify data URL decodes back to original bytes length
      const dataUrl = await fileStore.getDataUrl(put.fileId);
      expect(dataUrl.startsWith('data:')).toBe(true);
      const b64 = dataUrl.split(',')[1] || '';
      const decoded = fromBase64(b64);
      expect(decoded.byteLength).toBe(f.bytes.byteLength);

      // Link into Files tree
      const name = f.url.split('/').pop() || 'file.jpg';
      const fileVertex = FilesTreeData.createOrLinkFile({
        filesTree,
        parentFolder: folder,
        name,
        contentId: put.fileId,
        mimeType: f.mime,
        size: f.bytes.byteLength
      });
      expect(fileVertex.getProperty('contentId')).toBe(put.fileId);
    }

    // Allow batched ops to flush
    await wait(1200);

    // Verify we can load both space and files tree ops
    const loader = new FileSystemPersistenceLayer(tempDir, spaceId, fs);
    await loader.connect();
    const spaceOps = await loader.loadSpaceTreeOps();
    expect(spaceOps.length).toBeGreaterThan(0);
    const filesOps = await loader.loadTreeOps(filesTree.getId());
    expect(filesOps.length).toBeGreaterThan(0);
  });
});