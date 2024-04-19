import { FileSystem } from "./fs.ts";
import type { MkdirOptions } from "./fs.ts";

export const fsDeno: FileSystem = {
  async dirExists(path: string): Promise<boolean> {
    try {
      const stat = await Deno.stat(path);
      return stat.isDirectory;
    } catch (_) {
      return false;
    }
  },

  async fileExists(path: string): Promise<boolean> {
    try {
      const stat = await Deno.stat(path);
      return stat.isFile;
    } catch (_) {
      return false;
    }
  },

  async mkdir(path: string, options?: MkdirOptions): Promise<void> {
    await Deno.mkdir(path, options);
  },

  async writeTextFile(path: string, content: string): Promise<void> {
    await Deno.writeTextFile(path, content);
  },

  async readTextFile(path: string): Promise<string> {
    return await Deno.readTextFile(path);
  }
};
