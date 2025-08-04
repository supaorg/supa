# Multiplatform File System Persistence Layer

## Problem

The current `FileSystemPersistenceLayer` is tightly coupled to `clientState.fs`, which makes it unusable in Node.js environments like our demo space builder. This creates a need to duplicate file system logic and operations generation.

## Current State

```typescript
// packages/client/src/lib/spaces/persistence/FileSystemPersistenceLayer.ts
import { clientState } from "@supa/client/state/clientState.svelte";

export class FileSystemPersistenceLayer extends ConnectedPersistenceLayer {
  constructor(private spacePath: string, private spaceId: string) {
    super();
    // Uses clientState.fs directly
  }

  private async ensureDirectoryStructure(): Promise<void> {
    await clientState.fs.mkdir(this.spacePath, { recursive: true });
    // ... more clientState.fs usage
  }
}
```

**Issues:**
- ❌ Coupled to browser/Electron environment
- ❌ Cannot be used in Node.js build scripts
- ❌ Requires duplicating file system logic
- ❌ Manual operations generation prone to errors

## Proposed Solution

Inject the file system implementation into `FileSystemPersistenceLayer` to make it environment-agnostic.

## Implementation Plan

### Step 1: Create Node.js File System Implementation

```typescript
// packages/build-scripts/src/NodeFileSystem.ts
import { AppFileSystem, FileEntry, FileHandle, WatchEvent, UnwatchFn } from "@supa/client/appFs";
import { mkdir, writeFile, readFile, readdir, access } from 'fs/promises';

export class NodeFileSystem implements AppFileSystem {
  async readDir(path: string): Promise<FileEntry[]> {
    const entries = await readdir(path, { withFileTypes: true });
    return entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile()
    }));
  }

  async exists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  async readTextFile(path: string): Promise<string> {
    return await readFile(path, 'utf-8');
  }

  async readTextFileLines(path: string): Promise<string[]> {
    const content = await this.readTextFile(path);
    return content.split('\n').filter(line => line.trim());
  }

  async writeTextFile(path: string, content: string): Promise<void> {
    await writeFile(path, content, 'utf-8');
  }

  async create(path: string): Promise<FileHandle> {
    const dir = path.substring(0, path.lastIndexOf('/'));
    await mkdir(dir, { recursive: true });
    
    return {
      write: async (data: Uint8Array) => {
        await writeFile(path, data);
      },
      close: async () => {
        // No-op for Node.js
      }
    };
  }

  async open(path: string, options?: { append?: boolean }): Promise<FileHandle> {
    return {
      write: async (data: Uint8Array) => {
        const content = new TextDecoder().decode(data);
        if (options?.append) {
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

  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    await mkdir(path, { recursive: options?.recursive });
  }

  async watch(path: string, callback: (event: WatchEvent) => void, options?: { recursive?: boolean }): Promise<UnwatchFn> {
    // For build scripts, we don't need file watching
    return () => {};
  }
}
```

### Step 2: Modify FileSystemPersistenceLayer Constructor

```typescript
// packages/client/src/lib/spaces/persistence/FileSystemPersistenceLayer.ts
export class FileSystemPersistenceLayer extends ConnectedPersistenceLayer {
  constructor(
    private spacePath: string, 
    private spaceId: string,
    private fs: AppFileSystem // Inject file system
  ) {
    super();
    this.id = `filesystem-${spaceId}`;
    this.opsParser = new OpsParser();
  }

  // Update all methods to use this.fs instead of clientState.fs
  private async ensureDirectoryStructure(): Promise<void> {
    await this.fs.mkdir(this.spacePath, { recursive: true });
    // ... rest of the method using this.fs
  }
}
```

### Step 3: Update Existing Usage

```typescript
// packages/client/src/lib/spaces/persistence/persistenceUtils.ts
export function createPersistenceLayersForURI(spaceId: string, uri: string): PersistenceLayer[] {
  const layers: PersistenceLayer[] = [];

  if (uri.startsWith("local://")) {
    layers.push(new IndexedDBPersistenceLayer(spaceId));
  } else if (uri.startsWith("http://") || uri.startsWith("https://")) {
    layers.push(new IndexedDBPersistenceLayer(spaceId));
  } else {
    layers.push(new IndexedDBPersistenceLayer(spaceId));
    // Inject clientState.fs for browser/Electron environment
    layers.push(new FileSystemPersistenceLayer(uri, spaceId, clientState.fs));
  }

  return layers;
}
```

### Step 4: Update Build Script

```typescript
// packages/build-scripts/src/simple-builder.js
import { FileSystemPersistenceLayer } from "@supa/client/spaces/persistence";
import { NodeFileSystem } from "./NodeFileSystem";
import { Space, SpaceManager } from "@supa/core";

export class SimpleDemoBuilder {
  async buildFromConfig(config, outputPath) {
    const fs = new NodeFileSystem();
    const space = Space.newSpace(uuid());
    
    // Create persistence layer with Node.js file system
    const persistenceLayer = new FileSystemPersistenceLayer(outputPath, space.getId(), fs);
    
    // Use existing SpaceManager logic
    const spaceManager = new SpaceManager();
    await spaceManager.addNewSpace(space, [persistenceLayer]);
    
    // Add assistants, providers, conversations using existing Space APIs
    for (const assistant of config.assistants) {
      space.addAppConfig(assistant);
    }

    for (const provider of config.providers) {
      space.saveModelProviderConfig(provider);
    }

    for (const conversation of config.conversations) {
      const appTree = space.newAppTree(conversation.assistant);
      space.setAppTreeName(appTree.getId(), conversation.title);
      // Add messages using ChatAppData
    }
  }
}
```

## Benefits

1. **✅ Zero refactoring** of existing `FileSystemPersistenceLayer` logic
2. **✅ Reuses all operations** - parsing, directory structure, secrets handling
3. **✅ Same file format** - guaranteed compatibility with existing spaces
4. **✅ Environment agnostic** - works in browser, Electron, Node.js
5. **✅ Maintainable** - changes to file format apply everywhere
6. **✅ Testable** - can test file operations in isolation
7. **✅ Future-proof** - easy to add new file system implementations

## Migration Strategy

1. **Phase 1**: Create `NodeFileSystem` implementation
2. **Phase 2**: Modify `FileSystemPersistenceLayer` constructor to accept `fs` parameter
3. **Phase 3**: Update `persistenceUtils.ts` to inject `clientState.fs`
4. **Phase 4**: Update build script to use injected `FileSystemPersistenceLayer`
5. **Phase 5**: Remove manual operations generation from build script

## Alternative Approaches Considered

1. **Extract file operations** - Would require more refactoring
2. **Create separate Node.js persistence layer** - Would duplicate logic
3. **Use manual operations generation** - Current approach, error-prone and not maintainable

## Conclusion

The injection approach provides the cleanest solution with minimal changes to existing code while enabling multiplatform usage of the file system persistence layer. 