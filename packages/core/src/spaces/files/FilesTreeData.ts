import type { Vertex } from "reptree";
import { AppTree } from "../AppTree";
import type { Space } from "../Space";
import { FilesAppData } from "./FilesAppData";
import type { AttachmentPreview } from "./AttachmentPreview";
import type { FileInfo } from "./FileInfo";

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
		fileInfo: Partial<FileInfo>;
		attachment?: AttachmentPreview;
	}): Vertex {
		const { filesTree, parentFolder, fileInfo, attachment } = params;
		
		// Use fileInfo fields, fallback to attachment, then defaults
		const name = fileInfo.name ?? attachment?.name ?? "file";
		const hash = fileInfo.hash ?? "";
		const mimeType = fileInfo.mimeType ?? attachment?.mimeType;
		const size = fileInfo.size ?? attachment?.size;
		const width = fileInfo.width ?? attachment?.width;
		const height = fileInfo.height ?? attachment?.height;

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

	/** Returns normalized file info from a file vertex */
	static getFileInfo(fileVertex: Vertex): FileInfo {
		return {
			id: fileVertex.id,
			name: (fileVertex.getProperty('name') as string) ?? '',
			hash: (fileVertex.getProperty('hash') as string) ?? '',
			mimeType: fileVertex.getProperty('mimeType') as string,
			size: fileVertex.getProperty('size') as number,
			width: fileVertex.getProperty('width') as number,
			height: fileVertex.getProperty('height') as number,
		};
	}
}