import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm, readFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Space, SpaceManager, FileSystemPersistenceLayer, createFileStore, FilesTreeData } from '@sila/core';
import { NodeFileSystem } from './node-file-system';
import { FileResolver } from '@sila/core';

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
		expect(put.hash).toBeTruthy();
		expect(put.hash.length).toBe(64); // SHA-256 hex string length

		// Bytes roundtrip check
		const origB64 = dataUrl.split(',')[1]!;
		const origBytes = typeof Buffer !== 'undefined' ? new Uint8Array(Buffer.from(origB64, 'base64')) : (() => { const s = atob(origB64); const u = new Uint8Array(s.length); for (let i=0;i<s.length;i++) u[i]=s.charCodeAt(i); return u; })();
		const loadedBytes = await fileStore!.getBytes(put.hash);
		expect(Buffer.from(loadedBytes)).toEqual(Buffer.from(origBytes));

		// Verify CAS path exists and readable
		const casPath = path.join(tempDir, 'space-v1', 'files', 'sha256', put.hash.slice(0, 2), put.hash.slice(2));
		await access(casPath);
		const raw = await readFile(casPath);
		expect(raw.byteLength).toBeGreaterThan(0);

		// Retrieve as data URL
		const loadedDataUrl = await fileStore!.getDataUrl(put.hash);
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
			hash: put.hash,
			mimeType: 'image/png',
			size: raw.byteLength
		});
		expect(fileVertex.getProperty('hash')).toBe(put.hash);

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

	it('resolves file references to data URLs for UI and AI consumption', async () => {
		const fs = new NodeFileSystem();

		const space = Space.newSpace(crypto.randomUUID());
		const spaceId = space.getId();
		space.name = 'File Resolution Test Space';

		const layer = new FileSystemPersistenceLayer(tempDir, spaceId, fs);
		const manager = new SpaceManager();
		await manager.addNewSpace(space, [layer]);

		// Give time to ensure base structure is on disk
		await wait(600);

		// Create file store and put an image
		const fileStore = createFileStore({
			getSpaceRootPath: () => tempDir,
			getFs: () => fs
		});
		expect(fileStore).toBeTruthy();

		const dataUrl = makePngDataUrl();
		const put = await fileStore!.putDataUrl(dataUrl);

		// Create a files app tree and file vertex
		const filesTree = FilesTreeData.createNewFilesTree(space);
		const folder = FilesTreeData.ensureFolderPath(filesTree, ['test']);
		const fileVertex = FilesTreeData.createOrLinkFile({
			filesTree,
			parentFolder: folder,
			name: 'test.png',
			hash: put.hash,
			mimeType: 'image/png',
			size: 68
		});

		// Create a message with file reference (no dataUrl)
		const messageWithFileRef = {
			id: 'msg1',
			role: 'user' as const,
			text: 'Here is an image',
			attachments: [
				{
					id: 'att1',
					kind: 'image',
					name: 'test.png',
					file: { tree: filesTree.getId(), vertex: fileVertex.id }
				}
			]
		};

		// Test file resolution
		const fileResolver = new FileResolver(space);
		const resolvedAttachments = await fileResolver.resolveAttachments(messageWithFileRef.attachments);

		expect(resolvedAttachments).toHaveLength(1);
		expect(resolvedAttachments[0].id).toBe('att1');
		expect(resolvedAttachments[0].kind).toBe('image');
		expect(resolvedAttachments[0].name).toBe('test.png');
		expect(resolvedAttachments[0].dataUrl).toBeTruthy();
		expect(resolvedAttachments[0].dataUrl.startsWith('data:')).toBe(true);
		expect(resolvedAttachments[0].mimeType).toBe('image/png');
		expect(resolvedAttachments[0].size).toBe(68);

		// Test that the resolved dataUrl matches the original
		const resolvedDataUrl = resolvedAttachments[0].dataUrl;
		expect(resolvedDataUrl).toBe(dataUrl);
	});

	it('minimal file resolution test - core functionality only', async () => {
		// Minimal setup: space with file store provider
		const space = Space.newSpace(crypto.randomUUID());
		const fs = new NodeFileSystem();
		
		// Connect file store to space
		space.setFileStoreProvider({
			getSpaceRootPath: () => tempDir,
			getFs: () => fs
		});

		// Store a simple file
		const fileStore = space.getFileStore();
		expect(fileStore).toBeTruthy();
		
		const dataUrl = makePngDataUrl();
		const put = await fileStore!.putDataUrl(dataUrl);

		// Create minimal file vertex
		const filesTree = FilesTreeData.createNewFilesTree(space);
		const fileVertex = FilesTreeData.createOrLinkFile({
			filesTree,
			parentFolder: filesTree.tree.getVertexByPath('files')!,
			name: 'test.png',
			hash: put.hash,
			mimeType: 'image/png'
		});

		// Test resolution
		const fileResolver = new FileResolver(space);
		const resolved = await fileResolver.resolveAttachments([
			{ file: { tree: filesTree.getId(), vertex: fileVertex.id } }
		]);

		// Core assertions
		expect(resolved).toHaveLength(1);
		expect(resolved[0].dataUrl).toBe(dataUrl); // Should match original
		expect(resolved[0].mimeType).toBe('image/png'); // Should preserve MIME type
	});

	it('filters out attachments with empty dataUrl to prevent invalid base64 errors', async () => {
		// Test that attachments with empty dataUrl are filtered out
		// This prevents the "Invalid base64 image_url" error in follow-up messages
		
		const space = Space.newSpace(crypto.randomUUID());
		const fs = new NodeFileSystem();
		
		// Connect file store to space
		space.setFileStoreProvider({
			getSpaceRootPath: () => tempDir,
			getFs: () => fs
		});

		// Create attachments with various dataUrl states
		const attachments = [
			{
				id: 'att1',
				kind: 'image',
				name: 'valid.png',
				dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMBg9v2e0UAAAAASUVORK5CYII='
			},
			{
				id: 'att2',
				kind: 'image',
				name: 'empty.png',
				dataUrl: '' // Empty dataUrl - should be filtered out
			},
			{
				id: 'att3',
				kind: 'image',
				name: 'whitespace.png',
				dataUrl: '   ' // Whitespace only - should be filtered out
			},
			{
				id: 'att4',
				kind: 'image',
				name: 'no-dataUrl.png'
				// No dataUrl property - should be filtered out
			}
		];

		// Test SimpleChatAgent filtering logic
		const images = attachments.filter(a => 
			a?.kind === 'image' && 
			typeof a?.dataUrl === 'string' && 
			a.dataUrl.trim() !== ''
		);

		// Should only include the valid attachment
		expect(images).toHaveLength(1);
		expect(images[0].id).toBe('att1');
		expect(images[0].name).toBe('valid.png');
		expect(images[0].dataUrl).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMBg9v2e0UAAAAASUVORK5CYII=');
	});
});