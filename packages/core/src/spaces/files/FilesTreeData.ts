import type { Vertex } from "reptree";
import { AppTree } from "../AppTree";
import type { Space } from "../Space";
import { FilesAppData } from "./FilesAppData";

export class FilesTreeData {
	static createNewFilesTree(space: Space): AppTree {
		return FilesAppData.createNewFilesTree(space);
	}

	static async getOrCreateDefaultFilesTree(space: Space): Promise<AppTree> {
		return FilesAppData.getOrCreateDefaultFilesTree(space);
	}

	static ensureFolderPath(filesTree: AppTree, segments: string[]): Vertex {
		let root = filesTree.tree.getVertexByPath("files");
		if (!root) {
			// Lazily create files root if missing for targeted trees
			root = filesTree.tree.root!.newNamedChild("files") as Vertex;
			root.setProperty("createdAt", Date.now());
		}
		let cur = root as Vertex;
		for (const seg of segments) {
			const found = cur.children.find((c) => c.getProperty("_n") === seg);
			if (found) {
				cur = found;
				continue;
			}
			const v = filesTree.tree.newVertex(cur.id, { _n: seg, createdAt: Date.now() });
			cur = v;
		}
		return cur;
	}

	static createOrLinkFile(params: {
		filesTree: AppTree;
		parentFolder: Vertex;
		name: string;
		hash: string;
		mimeType?: string;
		size?: number;
		width?: number;
		height?: number;
		originalFormat?: string; // Track if file was converted
		conversionQuality?: number; // Track conversion quality
		originalDimensions?: string; // Track original dimensions if resized
		originalFilename?: string; // Track original filename if changed
	}): Vertex {
		const { filesTree, parentFolder, name, hash, mimeType, size, width, height, originalFormat, conversionQuality, originalDimensions, originalFilename } = params;
		const existing = parentFolder.children.find((c) => c.getProperty("hash") === hash || c.name === name);
		if (existing) return existing;
		return filesTree.tree.newVertex(parentFolder.id, {
			_n: "file",
			name,
			hash,
			mimeType,
			size,
			width,
			height,
			originalFormat, // Store original format if different
			conversionQuality, // Store conversion quality
			originalDimensions, // Store original dimensions if resized
			originalFilename, // Store original filename if changed
			createdAt: Date.now(),
		});
	}
}