import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm, readFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Space, SpaceManager, FileSystemPersistenceLayer, createFileStore, FilesTreeData } from '@sila/core';
import { NodeFileSystem } from './node-file-system';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function makePngDataUrl(): string {
	// 1x1 transparent PNG
	const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMBg9v2e0UAAAAASUVORK5CYII=';
	return `data:image/png;base64,${base64}`;
}

describe('Workspace file store (desktop, CAS) saving and loading', () => {
	let tempDir: string;

	beforeAll(async () => {
		tempDir = await mkdtemp(path.join(tmpdir(), 'sila-files-test-'));
	});

	afterAll(async () => {
		if (tempDir) {
			await rm(tempDir, { recursive: true, force: true });
		}
	});

	it('saves a data URL into CAS, creates a file vertex, and loads it back as data URL', async () => {
		const fs = new NodeFileSystem();

		const space = Space.newSpace(crypto.randomUUID());
		const spaceId = space.getId();
		space.name = 'Files Test Space';

		const layer = new FileSystemPersistenceLayer(tempDir, spaceId, fs);
		const manager = new SpaceManager();
		await manager.addNewSpace(space, [layer]);

		// Give time to ensure base structure is on disk
		await wait(600);

		// Verify space root structure exists
		await access(path.join(tempDir, 'sila.md'));
		await access(path.join(tempDir, 'space-v1', 'ops'));

		// Create file store bound to this workspace path
		const fileStore = createFileStore({
			getSpaceRootPath: () => tempDir,
			getFs: () => fs
		});
		expect(fileStore).toBeTruthy();

		// Put a small image
		const dataUrl = makePngDataUrl();
		const put = await fileStore!.putDataUrl(dataUrl);
		expect(put.fileId.startsWith('sha256:')).toBe(true);

		// Verify CAS path exists and readable
		const hash = put.fileId.slice('sha256:'.length);
		const casPath = path.join(tempDir, 'space-v1', 'files', 'sha256', hash.slice(0, 2), hash.slice(2) + '.bin');
		await access(casPath);
		const raw = await readFile(casPath);
		expect(raw.byteLength).toBeGreaterThan(0);

		// Retrieve as data URL
		const loadedDataUrl = await fileStore!.getDataUrl(put.fileId);
		expect(loadedDataUrl.startsWith('data:')).toBe(true);

		// Create a files app tree and link file
		const filesTree = FilesTreeData.createNewFilesTree(space);
		const now = new Date();
		const folder = FilesTreeData.ensureFolderPath(filesTree, [
			now.getUTCFullYear().toString(),
			(String(now.getUTCMonth() + 1)).padStart(2, '0'),
			(String(now.getUTCDate())).padStart(2, '0')
		]);
		const fileVertex = FilesTreeData.createOrLinkFile({
			filesTree,
			parentFolder: folder,
			name: 'pixel.png',
			contentId: put.fileId,
			mimeType: 'image/png',
			size: raw.byteLength
		});
		expect(fileVertex.getProperty('contentId')).toBe(put.fileId);

		// Allow ops to be flushed
		await wait(1200);

		// Validate by loading space ops back
		const loader = new FileSystemPersistenceLayer(tempDir, spaceId, fs);
		await loader.connect();
		const ops = await loader.loadSpaceTreeOps();
		expect(ops.length).toBeGreaterThan(0);

		// Load app tree ops
		const appOps = await loader.loadTreeOps(filesTree.getId());
		expect(appOps.length).toBeGreaterThan(0);
	});
});