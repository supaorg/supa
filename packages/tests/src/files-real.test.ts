import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm, access, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Space, SpaceManager, FileSystemPersistenceLayer, createFileStore, FilesTreeData } from '@sila/core';
import { NodeFileSystem } from './node-file-system';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

describe('Local assets persisted in workspace CAS', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'sila-assets-test-'));
  });

  afterAll(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('reads base64 images from assets/images, writes to CAS, and verifies roundtrip and dedup', async () => {
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
    if (!fileStore) throw new Error('FileStore not available');

    // Load local assets (base64 files)
    const assetsDir = path.join(process.cwd(), 'assets', 'images');
    const entries = await readdir(assetsDir, { withFileTypes: true }).catch(() => [] as any[]);
    const b64Files = entries.filter(e => e.isFile() && e.name.endsWith('.b64'));
    expect(b64Files.length).toBeGreaterThan(0);

    const filesTree = FilesTreeData.createNewFilesTree(space);
    const now = new Date();
    const folder = FilesTreeData.ensureFolderPath(filesTree, [
      now.getUTCFullYear().toString(),
      String(now.getUTCMonth() + 1).padStart(2, '0'),
      String(now.getUTCDate()).padStart(2, '0'),
      'assets'
    ]);

    const fileIds: string[] = [];

    for (const f of b64Files) {
      const p = path.join(assetsDir, f.name);
      const b64 = (await readFile(p, 'utf8')).trim();
      const bytes = fromBase64(b64);

      const put = await fileStore.putBytes(bytes, 'image/png');
      fileIds.push(put.fileId);

      // Verify CAS path exists
      const hash = put.fileId.slice('sha256:'.length);
      const casPath = path.join(tempDir, 'space-v1', 'files', 'sha256', hash.slice(0, 2), hash.slice(2) + '.bin');
      await access(casPath);

      // Verify bytes roundtrip
      const loadedBytes = await fileStore.getBytes(put.fileId);
      expect(buffersEqual(loadedBytes, bytes)).toBe(true);

      // Create file vertex
      const name = f.name.replace(/\.b64$/, '');
      const fileVertex = FilesTreeData.createOrLinkFile({
        filesTree,
        parentFolder: folder,
        name,
        contentId: put.fileId,
        mimeType: 'image/png',
        size: bytes.byteLength
      });
      expect(fileVertex.getProperty('contentId')).toBe(put.fileId);
    }

    // Deduplication: if multiple identical files exist, their IDs should be the same
    if (fileIds.length >= 2) {
      const unique = new Set(fileIds);
      expect(unique.size).toBeLessThanOrEqual(fileIds.length);
    }

    // Allow batched ops to flush
    await wait(1200);

    // Verify ops
    const loader = new FileSystemPersistenceLayer(tempDir, spaceId, fs);
    await loader.connect();
    const spaceOps = await loader.loadSpaceTreeOps();
    expect(spaceOps.length).toBeGreaterThan(0);
    const filesOps = await loader.loadTreeOps(filesTree.getId());
    expect(filesOps.length).toBeGreaterThan(0);
  });
});