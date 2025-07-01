# Space Management Refactor Proposal

## Current Problems

The current space management system has several architectural issues:

1. **Mixed Responsibilities**: `InBrowserSpaceSync` and `ServerSpaceSync` handle both persistence AND synchronization logic
2. **Tight Coupling**: Space is directly aware of specific persistence mechanisms  
3. **Duplication**: Both sync classes have similar operation handling code
4. **Complex Loading**: Different loading paths for local vs server vs hybrid scenarios
5. **Hard to Extend**: Adding new persistence types requires modifying existing classes
6. **Environment Specific**: Can't easily share space management logic between client and server

## Proposed Solution: Layered Persistence Architecture

### Core Architecture

```
Space (Pure business logic)
    ↓
SpaceManager (Orchestrates spaces)
    ↓
PersistenceLayer (Abstract interface)
    ↓
├── IndexedDBPersistenceLayer (Local browser storage)
├── ServerPersistenceLayer (Remote sync)
└── CompositePersistenceLayer (Multiple layers combined)
```

### Key Interfaces

#### PersistenceLayer Interface

```typescript
interface PersistenceLayer {
  // Lifecycle
  connect(): Promise<void>
  disconnect(): Promise<void>
  
  // Multi-tree support - handles both space tree and app trees
  loadSpaceTreeOps(): Promise<VertexOperation[]>
  saveTreeOps(treeId: string, ops: ReadonlyArray<VertexOperation>): Promise<void>
  
  // Tree loader callback for lazy loading AppTrees
  createTreeLoader(): (treeId: string) => Promise<VertexOperation[]>
  
  // Secrets management
  loadSecrets(): Promise<Record<string, string> | undefined>
  saveSecrets(secrets: Record<string, string>): Promise<void>
  
  // Metadata
  readonly id: string
  readonly type: 'local' | 'remote' | 'composite'
}
```

#### SpaceManager Interface

```typescript
interface SpaceManager {
  // Space lifecycle
  createSpace(config?: SpaceConfig): Promise<Space>
  loadSpace(pointer: SpacePointer, persistenceLayer: PersistenceLayer): Promise<Space>
  closeSpace(spaceId: string): Promise<void>
  
  // Persistence management
  addPersistenceLayer(spaceId: string, layer: PersistenceLayer): void
  removePersistenceLayer(spaceId: string, layerId: string): void
  
  // Registry
  getActiveSpaces(): Space[]
  getSpace(spaceId: string): Space | undefined
}
```

### Implementation Details

#### SpaceManager Implementation

```typescript
class SpaceManager {
  async loadSpace(spaceId: string, persistenceLayer: PersistenceLayer): Promise<Space> {
    await persistenceLayer.connect()
    
    // Load the main space tree operations
    const spaceOps = await persistenceLayer.loadSpaceTreeOps()
    const space = new Space(new RepTree(uuid(), spaceOps))
    
    // Register the tree loader for lazy AppTree loading
    const treeLoader = persistenceLayer.createTreeLoader()
    space.registerTreeLoader(async (appTreeId: string) => {
      const ops = await treeLoader(appTreeId)
      if (ops.length === 0) return undefined
      return new AppTree(new RepTree(uuid(), ops))
    })
    
    // Load secrets
    const secrets = await persistenceLayer.loadSecrets()
    if (secrets) {
      space.saveAllSecrets(secrets)
    }
    
    // Set up operation tracking
    this.setupOperationTracking(space, persistenceLayer)
    
    return space
  }
  
  private setupOperationTracking(space: Space, layer: PersistenceLayer) {
    // Track main space tree ops
    space.tree.observeOpApplied((op) => {
      if (op.id.peerId === space.tree.peerId && !op.transient) {
        layer.saveTreeOps(space.getId(), [op])
      }
    })
    
    // Track new AppTree creation
    space.observeNewAppTree((appTreeId) => {
      const appTree = space.getAppTree(appTreeId)!
      const ops = appTree.tree.getAllOps()
      layer.saveTreeOps(appTreeId, ops)
      
      // Track future ops on this AppTree
      appTree.tree.observeOpApplied((op) => {
        if (op.id.peerId === appTree.tree.peerId && !op.transient) {
          layer.saveTreeOps(appTreeId, [op])
        }
      })
    })
    
    // Track loaded AppTree operations
    space.observeTreeLoad((appTreeId) => {
      const appTree = space.getAppTree(appTreeId)!
      appTree.tree.observeOpApplied((op) => {
        if (op.id.peerId === appTree.tree.peerId && !op.transient) {
          layer.saveTreeOps(appTreeId, [op])
        }
      })
    })
    
    // Track secrets changes
    this.wrapSecretsMethod(space, layer)
  }
  
  private wrapSecretsMethod(space: Space, layer: PersistenceLayer) {
    const originalSetSecret = space.setSecret.bind(space)
    const originalSaveAllSecrets = space.saveAllSecrets.bind(space)

    space.setSecret = (key: string, value: string) => {
      originalSetSecret(key, value)
      layer.saveSecrets({ [key]: value })
    }

    space.saveAllSecrets = (secrets: Record<string, string>) => {
      originalSaveAllSecrets(secrets)
      layer.saveSecrets(secrets)
    }
  }
}
```

### Concrete Persistence Layer Implementations

#### IndexedDBPersistenceLayer
Wraps existing `localDb.ts` functionality:
```typescript
class IndexedDBPersistenceLayer implements PersistenceLayer {
  constructor(private spaceId: string) {}
  
  async loadSpaceTreeOps(): Promise<VertexOperation[]> {
    return await getTreeOps(this.spaceId, this.spaceId)
  }
  
  async saveTreeOps(treeId: string, ops: ReadonlyArray<VertexOperation>): Promise<void> {
    await appendTreeOps(this.spaceId, treeId, ops)
  }
  
  createTreeLoader(): (treeId: string) => Promise<VertexOperation[]> {
    return async (treeId: string) => {
      // Try local first, then server if available
      let ops = await getTreeOps(this.spaceId, treeId)
      if (ops.length === 0) {
        ops = await getSpaceTreeOps(this.spaceId, treeId) // Server fallback
      }
      return ops
    }
  }
  
  async loadSecrets(): Promise<Record<string, string> | undefined> {
    return await getAllSecrets(this.spaceId)
  }
  
  async saveSecrets(secrets: Record<string, string>): Promise<void> {
    await saveAllSecrets(this.spaceId, secrets)
  }
}
```

#### ServerPersistenceLayer
For server-side or client-server sync:
```typescript
class ServerPersistenceLayer implements PersistenceLayer {
  constructor(
    private spaceId: string, 
    private serverUrl?: string, // For client-side
    private dbPath?: string     // For server-side
  ) {}
  
  async loadSpaceTreeOps(): Promise<VertexOperation[]> {
    if (this.dbPath) {
      // Server-side: load from SQLite
      return await this.loadTreeOpsFromDb(this.spaceId)
    } else {
      // Client-side: load from server API
      return await getSpaceTreeOps(this.spaceId, this.spaceId)
    }
  }
  
  createTreeLoader(): (treeId: string) => Promise<VertexOperation[]> {
    return async (treeId: string) => {
      if (this.dbPath) {
        return await this.loadTreeOpsFromDb(treeId)
      } else {
        return await getSpaceTreeOps(this.spaceId, treeId)
      }
    }
  }
}
```

#### CompositePersistenceLayer
Combines multiple layers with conflict resolution:
```typescript
class CompositePersistenceLayer implements PersistenceLayer {
  constructor(private layers: PersistenceLayer[]) {}
  
  async loadSpaceTreeOps(): Promise<VertexOperation[]> {
    // Load from all layers and merge using RepTree's conflict resolution
    const allOps: VertexOperation[] = []
    for (const layer of this.layers) {
      const ops = await layer.loadSpaceTreeOps()
      allOps.push(...ops)
    }
    
    // RepTree will handle deduplication and conflict resolution
    return allOps
  }
  
  async saveTreeOps(treeId: string, ops: ReadonlyArray<VertexOperation>): Promise<void> {
    // Save to all layers in parallel
    await Promise.all(
      this.layers.map(layer => layer.saveTreeOps(treeId, ops))
    )
  }
}
```

### Usage Examples

#### Client-Side Usage

```typescript
// Local-only space
const localLayer = new IndexedDBPersistenceLayer(spaceId)
const space = await spaceManager.loadSpace(spaceId, localLayer)

// Server-synced space  
const serverLayer = new ServerPersistenceLayer(spaceId, 'https://api.t69.chat')
const space = await spaceManager.loadSpace(spaceId, serverLayer)

// Hybrid space (local + server)
const composite = new CompositePersistenceLayer([localLayer, serverLayer])
const space = await spaceManager.loadSpace(spaceId, composite)
```

#### Server-Side Usage

```typescript
// Server-only space
const serverLayer = new ServerPersistenceLayer(spaceId, undefined, './data/spaces')
const space = await spaceManager.loadSpace(spaceId, serverLayer)
```

## Benefits

1. **Separation of Concerns**: Space contains pure business logic, persistence is separate
2. **Composability**: Mix and match persistence strategies per space
3. **Testability**: Easy to mock persistence layers for testing
4. **Extensibility**: Add new persistence types without changing existing code
5. **Flexibility**: A space can be local-only, server-synced, or both
6. **Environment Agnostic**: Same SpaceManager API works on client and server
7. **Conflict Resolution**: RepTree handles merging operations from multiple sources
8. **Lazy Loading**: Maintains existing AppTree lazy loading pattern

## Migration Plan

1. **Phase 1**: Create new interfaces and base implementations
2. **Phase 2**: Implement `IndexedDBPersistenceLayer` wrapping existing `localDb.ts`
3. **Phase 3**: Implement `ServerPersistenceLayer` wrapping existing server sync logic
4. **Phase 4**: Create `SpaceManager` and update client code to use it
5. **Phase 5**: Update server code to use new architecture
6. **Phase 6**: Remove old `InBrowserSpaceSync` and `ServerSpaceSync` classes

## File Structure

```
packages/core/src/spaces/
├── Space.ts (unchanged)
├── AppTree.ts (unchanged)
├── persistence/
│   ├── PersistenceLayer.ts (interface)
│   ├── IndexedDBPersistenceLayer.ts
│   ├── ServerPersistenceLayer.ts
│   └── CompositePersistenceLayer.ts
└── SpaceManager.ts

packages/client/src/lib/spaces/
├── spaceManager.ts (client-specific setup)
└── (legacy files to be removed after migration)

packages/server/src/lib/
└── spaceManager.ts (server-specific setup)
```

This refactor will significantly improve the maintainability and extensibility of the space management system while preserving all existing functionality. 