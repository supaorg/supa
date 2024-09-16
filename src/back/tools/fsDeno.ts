import { FileSystem, DirEntry } from "./fs.ts";
import type { MkdirOptions, RemoveOptions } from "./fs.ts";
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

  async readDir(path: string): Promise<DirEntry[]> {
    try {
      const entries = [];
      for await (const dirEntry of Deno.readDir(path)) {
        entries.push(dirEntry);
      }
      return entries;
    } catch(e) {
      throw(e);
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

  mkdir(path: string, options?: MkdirOptions): Promise<void> {
    return Deno.mkdir(path, options);
  },

  ensureDir(path: string): Promise<void> {
    return ensureDir(path);
  },

  writeTextFile(path: string, content: string): Promise<void> {
    return Deno.writeTextFile(path, content);
  },

  readTextFile(path: string): Promise<string> {
    return Deno.readTextFile(path);
  },

  remove(path: string, options?: RemoveOptions): Promise<void> {
    return Deno.remove(path, options);
  },
};
