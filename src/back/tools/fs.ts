import { fsDeno } from "./fsDeno.ts";

export interface FileSystem {
  dirExists(path: string): Promise<boolean>;
  readDir(path: string): Promise<DirEntry[]>;
  fileExists(path: string): Promise<boolean>;
  mkdir(path: string, options?: MkdirOptions): Promise<void>;
  ensureDir(path: string): Promise<void>;
  writeTextFile(path: string, content: string): Promise<void>;
  readTextFile(path: string): Promise<string>;
  remove(path: string, options?: RemoveOptions): Promise<void>;
}

export interface MkdirOptions {
  recursive?: boolean;
}

export interface RemoveOptions {
  recursive?: boolean;
}

export interface DirEntry {
  name: string;
  isFile: boolean;
  isDirectory: boolean;
  isSymlink: boolean;
}

function createFs(): FileSystem {
  if (typeof Deno !== 'undefined') {
    return fsDeno;
  } else {
    throw new Error('Unsupported runtime');
  }
}

export const fs: FileSystem = createFs();