import type { Vertex } from "reptree";
import { AppTree } from "../AppTree";
import type { Space } from "../Space";
import { FilesAppData } from "./FilesAppData";

export class FilesTreeData {
	static createNewFilesTree(space: Space): AppTree {
		return FilesAppData.createNewFilesTree(space);
	}

	static getOrCreateDefaultFilesTree(space: Space): AppTree {
		return FilesAppData.getOrCreateDefaultFilesTree(space);
	}

	static ensureFolderPath(filesTree: AppTree, segments: string[]): Vertex {
		const root = filesTree.tree.getVertexByPath("files");
		if (!root) throw new Error("Files root not found");
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
	}): Vertex {
		const { filesTree, parentFolder, name, hash, mimeType, size, width, height } = params;
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
			createdAt: Date.now(),
		});
	}
}