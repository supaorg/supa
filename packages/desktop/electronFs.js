import * as fs from 'fs/promises';
import * as path from 'path';
import { createWriteStream } from 'fs';
import { watch } from 'chokidar';

export class ElectronFileSystem {
  async readDir(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries.map(entry => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile()
      }));
    } catch (error) {
      console.error('Failed to read directory:', dirPath, error);
      throw error;
    }
  }

  async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async readTextFile(filePath) {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error('Failed to read file:', filePath, error);
      throw error;
    }
  }

  async readTextFileLines(filePath) {
    const content = await this.readTextFile(filePath);
    const lines = content.split('\n');
    
    return (async function* () {
      for (const line of lines) {
        yield line;
      }
    })();
  }

  async writeTextFile(filePath, content) {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      console.error('Failed to write file:', filePath, error);
      throw error;
    }
  }

  async create(filePath) {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      // Create the file if it doesn't exist
      const fileHandle = await fs.open(filePath, 'w');
      
      return {
        async write(data) {
          await fileHandle.write(data);
        },
        async close() {
          await fileHandle.close();
        }
      };
    } catch (error) {
      console.error('Failed to create file:', filePath, error);
      throw error;
    }
  }

  async open(filePath, options) {
    try {
      const flag = options?.append ? 'a' : 'w';
      const fileHandle = await fs.open(filePath, flag);
      
      return {
        async write(data) {
          await fileHandle.write(data);
        },
        async close() {
          await fileHandle.close();
        }
      };
    } catch (error) {
      console.error('Failed to open file:', filePath, error);
      throw error;
    }
  }

  async mkdir(dirPath, options) {
    try {
      await fs.mkdir(dirPath, { recursive: options?.recursive || false });
    } catch (error) {
      console.error('Failed to create directory:', dirPath, error);
      throw error;
    }
  }

  async watch(watchPath, callback, options) {
    try {
      const watcher = watch(watchPath, {
        persistent: true,
        ignoreInitial: true
      });

      watcher.on('add', (filePath) => {
        callback({
          type: { create: { kind: 'file' } },
          paths: [filePath]
        });
      });

      watcher.on('addDir', (dirPath) => {
        callback({
          type: { create: { kind: 'folder' } },
          paths: [dirPath]
        });
      });

      watcher.on('change', (filePath) => {
        callback({
          type: { modify: { kind: 'data' } },
          paths: [filePath]
        });
      });

      watcher.on('unlink', (filePath) => {
        callback({
          type: { remove: { kind: 'file' } },
          paths: [filePath]
        });
      });

      watcher.on('unlinkDir', (dirPath) => {
        callback({
          type: { remove: { kind: 'folder' } },
          paths: [dirPath]
        });
      });

      watcher.on('error', (error) => {
        console.error('File watcher error:', error);
      });

      return () => {
        watcher.close();
      };
    } catch (error) {
      console.error('Failed to set up file watcher:', watchPath, error);
      throw error;
    }
  }
}

export const electronFs = new ElectronFileSystem(); 