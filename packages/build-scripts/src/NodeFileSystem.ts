import { mkdir, writeFile, readFile, readdir, access } from 'fs/promises';
import { join } from 'path';

export class NodeFileSystem {
  async readDir(path: string) {
    const entries = await readdir(path, { withFileTypes: true });
    return entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile()
    }));
  }

  async exists(path: string) {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  async readTextFile(path: string) {
    return await readFile(path, 'utf-8');
  }

  async readTextFileLines(path: string) {
    const content = await this.readTextFile(path);
    return content.split('\n').filter(line => line.trim());
  }

  async writeTextFile(path: string, content: string) {
    await writeFile(path, content, 'utf-8');
  }

  async create(path: string) {
    // Create directory if needed
    const dir = path.substring(0, path.lastIndexOf('/'));
    await mkdir(dir, { recursive: true });
    
    return {
      write: async (data) => {
        await writeFile(path, data);
      },
      close: async () => {
        // No-op for Node.js
      }
    };
  }

  async open(path, options = {}) {
    return {
      write: async (data) => {
        const content = new TextDecoder().decode(data);
        if (options.append) {
          await writeFile(path, content, { flag: 'a' });
        } else {
          await writeFile(path, content);
        }
      },
      close: async () => {
        // No-op for Node.js
      }
    };
  }

  async mkdir(path, options = {}) {
    await mkdir(path, { recursive: options.recursive });
  }

  async watch(path, callback, options = {}) {
    // For build scripts, we don't need file watching
    return () => {};
  }
} 