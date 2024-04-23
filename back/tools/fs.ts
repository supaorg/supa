import { fsDeno } from "./fsDeno.ts";

export interface FileSystem {
  dirExists(path: string): Promise<boolean>;
  fileExists(path: string): Promise<boolean>;
  mkdir(path: string, options?: MkdirOptions): Promise<void>;
  ensureDir(path: string): Promise<void>;
  writeTextFile(path: string, content: string): Promise<void>;
  readTextFile(path: string): Promise<string>;
}

export interface MkdirOptions {
  recursive?: boolean;
}

function createFs(): FileSystem {
  if (typeof Deno !== 'undefined') {
    return fsDeno;
  } else {
    throw new Error('Unsupported runtime');
  }
}

export const fs: FileSystem = createFs();