import type { AppFileSystem, FileEntry, FileHandle, WatchEvent, UnwatchFn } from '@supa/client/appFs';

// Extend the Window interface to include our exposed APIs
declare global {
  interface Window {
    electronFs: {
      readDir: (path: string) => Promise<FileEntry[]>;
      exists: (path: string) => Promise<boolean>;
      readTextFile: (path: string) => Promise<string>;
      readTextFileLines: (path: string) => Promise<AsyncIterable<string>>;
      writeTextFile: (path: string, content: string) => Promise<void>;
      create: (path: string) => Promise<FileHandle>;
      open: (path: string, options?: { append?: boolean }) => Promise<FileHandle>;
      mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
      watch: (path: string, callback: (event: WatchEvent) => void, options?: { recursive?: boolean }) => Promise<UnwatchFn>;
    };
    electronAPI: {
      platform: string;
      versions: Record<string, string>;
    };
  }
}

/**
 * Wrapper class that implements AppFileSystem interface
 * by delegating to the exposed electronFs API from the preload script
 */
export class ElectronFsWrapper implements AppFileSystem {
  private get electronFs() {
    if (!window.electronFs) {
      throw new Error('electronFs not available. Make sure the preload script is loaded.');
    }
    return window.electronFs;
  }

  async readDir(path: string): Promise<FileEntry[]> {
    return this.electronFs.readDir(path);
  }

  async exists(path: string): Promise<boolean> {
    return this.electronFs.exists(path);
  }

  async readTextFile(path: string): Promise<string> {
    return this.electronFs.readTextFile(path);
  }

  async readTextFileLines(path: string): Promise<AsyncIterable<string>> {
    return this.electronFs.readTextFileLines(path);
  }

  async writeTextFile(path: string, content: string): Promise<void> {
    return this.electronFs.writeTextFile(path, content);
  }

  async create(path: string): Promise<FileHandle> {
    return this.electronFs.create(path);
  }

  async open(path: string, options?: { append?: boolean }): Promise<FileHandle> {
    return this.electronFs.open(path, options);
  }

  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    return this.electronFs.mkdir(path, options);
  }

  async watch(
    path: string,
    callback: (event: WatchEvent) => void,
    options?: { recursive?: boolean }
  ): Promise<UnwatchFn> {
    return this.electronFs.watch(path, callback, options);
  }
}

export const electronFsWrapper = new ElectronFsWrapper(); 