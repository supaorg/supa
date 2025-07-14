// File system interface types
export interface FileEntry {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
}

export interface FileHandle {
  write(data: Uint8Array): Promise<void>;
  close(): Promise<void>;
}

export interface WatchEvent {
  type: 
    | { create: { kind: 'file' | 'folder' } }
    | { modify: { kind: 'data' | 'metadata' | 'rename', mode?: 'any' | 'content' } }
    | { remove: { kind: 'file' | 'folder' } };
  paths: string[];
}

export type UnwatchFn = () => void;

// Main file system interface
export interface AppFileSystem {
  readDir(path: string): Promise<FileEntry[]>;
  exists(path: string): Promise<boolean>;
  readTextFile(path: string): Promise<string>;
  readTextFileLines(path: string): Promise<AsyncIterable<string>>;
  writeTextFile(path: string, content: string): Promise<void>;
  create(path: string): Promise<FileHandle>;
  open(path: string, options?: { append?: boolean }): Promise<FileHandle>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  watch(path: string, callback: (event: WatchEvent) => void, options?: { recursive?: boolean }): Promise<UnwatchFn>;
}

// Dummy implementation that logs warnings
const dummyFileSystem: AppFileSystem = {
  async readDir(path: string): Promise<FileEntry[]> {
    console.warn('appFs.readDir called with dummy implementation:', path);
    return [];
  },

  async exists(path: string): Promise<boolean> {
    console.warn('appFs.exists called with dummy implementation:', path);
    return false;
  },

  async readTextFile(path: string): Promise<string> {
    console.warn('appFs.readTextFile called with dummy implementation:', path);
    throw new Error('File reading not implemented');
  },

  async readTextFileLines(path: string): Promise<AsyncIterable<string>> {
    console.warn('appFs.readTextFileLines called with dummy implementation:', path);
    return (async function* () {})();
  },

  async writeTextFile(path: string, content: string): Promise<void> {
    console.warn('appFs.writeTextFile called with dummy implementation:', path, content.length + ' chars');
    throw new Error('File writing not implemented');
  },

  async create(path: string): Promise<FileHandle> {
    console.warn('appFs.create called with dummy implementation:', path);
    return {
      async write(data: Uint8Array): Promise<void> {
        console.warn('FileHandle.write called with dummy implementation:', data.length + ' bytes');
      },
      async close(): Promise<void> {
        console.warn('FileHandle.close called with dummy implementation');
      }
    };
  },

  async open(path: string, options?: { append?: boolean }): Promise<FileHandle> {
    console.warn('appFs.open called with dummy implementation:', path, options);
    return {
      async write(data: Uint8Array): Promise<void> {
        console.warn('FileHandle.write called with dummy implementation:', data.length + ' bytes');
      },
      async close(): Promise<void> {
        console.warn('FileHandle.close called with dummy implementation');
      }
    };
  },

  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    console.warn('appFs.mkdir called with dummy implementation:', path, options);
  },

  async watch(path: string, callback: (event: WatchEvent) => void, options?: { recursive?: boolean }): Promise<UnwatchFn> {
    console.warn('appFs.watch called with dummy implementation:', path, options);
    return () => {
      console.warn('UnwatchFn called with dummy implementation');
    };
  }
};

// Current implementation - starts as dummy but can be injected
let currentFileSystem: AppFileSystem = dummyFileSystem;

// Function to inject a real implementation
export function setAppFileSystem(implementation: AppFileSystem): void {
  currentFileSystem = implementation;
}

// Function to reset to dummy implementation
export function resetAppFileSystem(): void {
  currentFileSystem = dummyFileSystem;
}

// Export the current implementation functions
export const appFs = {
  get readDir() { return currentFileSystem.readDir.bind(currentFileSystem); },
  get exists() { return currentFileSystem.exists.bind(currentFileSystem); },
  get readTextFile() { return currentFileSystem.readTextFile.bind(currentFileSystem); },
  get readTextFileLines() { return currentFileSystem.readTextFileLines.bind(currentFileSystem); },
  get writeTextFile() { return currentFileSystem.writeTextFile.bind(currentFileSystem); },
  get create() { return currentFileSystem.create.bind(currentFileSystem); },
  get open() { return currentFileSystem.open.bind(currentFileSystem); },
  get mkdir() { return currentFileSystem.mkdir.bind(currentFileSystem); },
  get watch() { return currentFileSystem.watch.bind(currentFileSystem); }
}; 