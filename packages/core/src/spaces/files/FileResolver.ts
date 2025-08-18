import type { Space } from "../Space";
import type { AppTree } from "../AppTree";
import type { Vertex } from "reptree";

export interface FileReference {
	tree: string;
	vertex: string;
}

export interface ResolvedAttachment {
	id: string;
	kind: string;
	name?: string;
	alt?: string;
	dataUrl: string;
	mimeType?: string;
	size?: number;
	width?: number;
	height?: number;
}

export interface ResolvedFileInfo {
	id: string;
	name: string;
	mimeType?: string;
	size?: number;
	width?: number;
	height?: number;
	url: string; // sila:// URL instead of dataUrl
	hash: string;
}

export class FileResolver {
	constructor(private space: Space) {}

	/**
	 * Resolves a single file reference to file information
	 * Framework-agnostic method for resolving file references
	 */
	async resolveFileReference(fileRef: FileReference): Promise<ResolvedFileInfo | null> {
		try {
			// Validate fileRef before proceeding
			if (!fileRef || !fileRef.tree || !fileRef.vertex) {
				console.warn('Invalid file reference:', fileRef);
				return null;
			}

			// Load the files app tree
			const filesTree = await this.loadAppTree(fileRef.tree);
			if (!filesTree) {
				console.warn(`Files tree not found: ${fileRef.tree}`);
				return null;
			}

			// Get the file vertex
			const fileVertex = filesTree.tree.getVertex(fileRef.vertex);
			if (!fileVertex) {
				console.warn(`File vertex not found: ${fileRef.vertex}`);
				return null;
			}

			// Extract metadata from the file vertex
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

			// Generate sila:// URL instead of loading bytes
			const spaceId = this.space.getId();
			const params: string[] = [];
			if (mimeType) {
				params.push(`type=${encodeURIComponent(mimeType)}`);
			}
			if (name) {
				params.push(`name=${encodeURIComponent(name)}`);
			}
			const query = params.length > 0 ? `?${params.join('&')}` : '';
			const url = `sila://spaces/${spaceId}/files/${hash}${query}`;

			return {
				id: fileRef.vertex,
				name: name || 'Unknown file',
				mimeType,
				size,
				width,
				height,
				url,
				hash,
			};
		} catch (error) {
			console.error('Failed to resolve file reference:', error);
			return null;
		}
	}

	/**
	 * Resolves multiple file references
	 */
	async resolveFileReferences(fileRefs: FileReference[]): Promise<ResolvedFileInfo[]> {
		const resolved: ResolvedFileInfo[] = [];
		
		for (const fileRef of fileRefs) {
			const resolvedFile = await this.resolveFileReference(fileRef);
			if (resolvedFile) {
				resolved.push(resolvedFile);
			}
		}
		
		return resolved;
	}
  
	/**
	 * Resolves file references in attachments to data URLs
	 * Used for UI rendering and AI consumption
	 */
	async resolveAttachments(attachments: Array<any>): Promise<ResolvedAttachment[]> {
		if (!attachments || attachments.length === 0) {
			return [];
		}

		const resolved: ResolvedAttachment[] = [];
		const fileStore = this.space.getFileStore();

		for (const attachment of attachments) {
			// If already has dataUrl, use it (transient data)
			if (attachment.dataUrl) {
				resolved.push({
					id: attachment.id,
					kind: attachment.kind,
					name: attachment.name,
					alt: attachment.alt,
					dataUrl: attachment.dataUrl,
					mimeType: attachment.mimeType,
					size: attachment.size,
					width: attachment.width,
					height: attachment.height,
				});
				continue;
			}

			// If has file reference, resolve it
			if (attachment.file?.tree && attachment.file?.vertex) {
				try {
					const resolvedAttachment = await this.resolveFileReferenceForAttachment(
						attachment.file as FileReference,
						attachment,
						fileStore
					);
					if (resolvedAttachment) {
						resolved.push(resolvedAttachment);
					}
				} catch (error) {
					console.warn("Failed to resolve file reference:", error);
					// Skip attachments that failed to resolve instead of including empty dataUrl
					// This prevents AI from receiving invalid base64 data
				}
				continue;
			}

			// Fallback: just pass through the attachment
			resolved.push({
				id: attachment.id,
				kind: attachment.kind,
				name: attachment.name,
				alt: attachment.alt,
				dataUrl: attachment.dataUrl || "",
				mimeType: attachment.mimeType,
				size: attachment.size,
				width: attachment.width,
				height: attachment.height,
			});
		}

		return resolved;
	}

	/**
	 * Resolves a single file reference to a data URL for attachments
	 */
	private async resolveFileReferenceForAttachment(
		fileRef: FileReference,
		originalAttachment: any,
		fileStore: any
	): Promise<ResolvedAttachment | null> {
		// Load the files app tree
		const filesTree = await this.loadAppTree(fileRef.tree);
		if (!filesTree) {
			throw new Error(`Files tree not found: ${fileRef.tree}`);
		}

		// Get the file vertex
		const fileVertex = filesTree.tree.getVertex(fileRef.vertex);
		if (!fileVertex) {
			throw new Error(`File vertex not found: ${fileRef.vertex}`);
		}

		// Get the hash from the file vertex
		const hash = fileVertex.getProperty("hash") as string;
		if (!hash) {
			throw new Error(`File vertex missing hash: ${fileRef.vertex}`);
		}

		// If no FileStore available, we can't load the bytes
		if (!fileStore) {
			throw new Error("FileStore not available for resolving file references");
		}

		// Load the bytes from CAS
		const bytes = await fileStore.getBytes(hash);

		// Get metadata from the file vertex
		const mimeType = fileVertex.getProperty("mimeType") as string;
		const size = fileVertex.getProperty("size") as number;
		const width = fileVertex.getProperty("width") as number;
		const height = fileVertex.getProperty("height") as number;

		// Convert bytes to data URL with proper MIME type
		const base64 = typeof Buffer !== "undefined" ? Buffer.from(bytes).toString("base64") : btoa(String.fromCharCode(...bytes));
		const dataUrl = `data:${mimeType || 'application/octet-stream'};base64,${base64}`;

		return {
			id: originalAttachment.id,
			kind: originalAttachment.kind,
			name: originalAttachment.name || fileVertex.getProperty("name"),
			alt: originalAttachment.alt,
			dataUrl,
			mimeType,
			size,
			width,
			height,
		};
	}

	/**
	 * Loads an app tree by ID
	 */
	private async loadAppTree(treeId: string): Promise<AppTree | undefined> {
		// Use the public loadAppTree method from Space
		return await this.space.loadAppTree(treeId);
	}
}
