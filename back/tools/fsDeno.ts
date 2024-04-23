import { FileSystem } from "./fs.ts";
import type { MkdirOptions } from "./fs.ts";
import { ensureDir } from "https://deno.land/std/fs/mod.ts";

export const fsDeno: FileSystem = {
  async dirExists(path: string): Promise<boolean> {
    try {
      const stat = await Deno.stat(path);
      return stat.isDirectory;
    } catch (e) {
      if (e.name === 'EPERM' || e.name === 'EACCES') {
        throw e;
      }

      return false;
    }
  },

  async fileExists(path: string): Promise<boolean> {
    try {
      const stat = await Deno.stat(path);
      return stat.isFile;
    } catch (e) {
      if (e.name === 'EPERM' || e.name === 'EACCES') {
        throw e;
      }

      return false;
    }
  },

  async mkdir(path: string, options?: MkdirOptions): Promise<void> {
    await Deno.mkdir(path, options);
  },

  async ensureDir(path: string): Promise<void> {
    await ensureDir(path);
  },

  async writeTextFile(path: string, content: string): Promise<void> {
    await Deno.writeTextFile(path, content);
  },

  async readTextFile(path: string): Promise<string> {
    return await Deno.readTextFile(path);
  }
};
