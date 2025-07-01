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
SpaceManager (Orchestrates spaces) - in core
    ↓
PersistenceLayer (Abstract interface) - in core
    ↓
├── IndexedDBPersistenceLayer (Client-side browser storage)
├── ServerPersistenceLayer (Client-side HTTP sync)
└── SQLitePersistenceLayer (Server-side database)
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
  
  // Sync capabilities
  readonly supportsIncomingSync: boolean
  
  // Optional: for two-way sync layers
  startListening?(onIncomingOps: (treeId: string, ops: VertexOperation[]) => void): Promise<void>
  stopListening?(): Promise<void>
  
  // Metadata
  readonly id: string
  readonly type: 'local' | 'remote'
}
```

#### SpaceManager Interface

```typescript
interface SpaceManager {
  // Space lifecycle
  createSpace(config?: SpaceConfig): Promise<Space>
  loadSpace(pointer: SpacePointer, persistenceLayers: PersistenceLayer[]): Promise<Space>
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
  private spaceLayers = new Map<string, PersistenceLayer[]>()

  async loadSpace(spaceId: string, persistenceLayers: PersistenceLayer[]): Promise<Space> {
    // Connect all layers
    await Promise.all(persistenceLayers.map(layer => layer.connect()))
    
    // Load operations from all layers and merge
    const allOps: VertexOperation[] = []
    for (const layer of persistenceLayers) {
      const ops = await layer.loadSpaceTreeOps()
      allOps.push(...ops)
    }
    
    // RepTree handles deduplication and conflict resolution
    const space = new Space(new RepTree(uuid(), allOps))
    
    // Register tree loader that tries all layers
    space.registerTreeLoader(async (appTreeId: string) => {
      const allTreeOps: VertexOperation[] = []
      for (const layer of persistenceLayers) {
        const loader = layer.createTreeLoader()
        const ops = await loader(appTreeId)
        allTreeOps.push(...ops)
      }
      if (allTreeOps.length === 0) return undefined
      return new AppTree(new RepTree(uuid(), allTreeOps))
    })
    
    // Load secrets from all layers and merge  
    const allSecrets: Record<string, string> = {}
    for (const layer of persistenceLayers) {
      const secrets = await layer.loadSecrets()
      if (secrets) {
        Object.assign(allSecrets, secrets)
      }
    }
    if (Object.keys(allSecrets).length > 0) {
      space.saveAllSecrets(allSecrets)
    }
    
    // Set up operation tracking to save to all layers
    this.setupOperationTracking(space, persistenceLayers)
    
    // Set up two-way sync for layers that support it
    for (const layer of persistenceLayers) {
      if (layer.supportsIncomingSync && layer.startListening) {
        await layer.startListening((treeId, incomingOps) => {
          // Apply incoming operations to the appropriate tree
          if (treeId === spaceId) {
            space.tree.merge(incomingOps)
          } else {
            const appTree = space.getAppTree(treeId)
            if (appTree) {
              appTree.tree.merge(incomingOps)
            }
          }
        })
      }
    }
    
    this.spaceLayers.set(spaceId, persistenceLayers)
    
    return space
  }
  
  private setupOperationTracking(space: Space, layers: PersistenceLayer[]) {
    // Track main space tree ops
    space.tree.observeOpApplied((op) => {
      if (op.id.peerId === space.tree.peerId && !op.transient) {
        // Save to all layers in parallel
        Promise.all(layers.map(layer => layer.saveTreeOps(space.getId(), [op])))
      }
    })
    
    // Track new AppTree creation
    space.observeNewAppTree((appTreeId) => {
      const appTree = space.getAppTree(appTreeId)!
      const ops = appTree.tree.getAllOps()
      
      // Save initial ops to all layers
      Promise.all(layers.map(layer => layer.saveTreeOps(appTreeId, ops)))
      
      // Track future ops on this AppTree
      appTree.tree.observeOpApplied((op) => {
        if (op.id.peerId === appTree.tree.peerId && !op.transient) {
          Promise.all(layers.map(layer => layer.saveTreeOps(appTreeId, [op])))
        }
      })
    })
    
    // Track loaded AppTree operations
    space.observeTreeLoad((appTreeId) => {
      const appTree = space.getAppTree(appTreeId)!
      appTree.tree.observeOpApplied((op) => {
        if (op.id.peerId === appTree.tree.peerId && !op.transient) {
          Promise.all(layers.map(layer => layer.saveTreeOps(appTreeId, [op])))
        }
      })
    })
    
    // Track secrets changes
    this.wrapSecretsMethod(space, layers)
  }
  
  private wrapSecretsMethod(space: Space, layers: PersistenceLayer[]) {
    const originalSetSecret = space.setSecret.bind(space)
    const originalSaveAllSecrets = space.saveAllSecrets.bind(space)

    space.setSecret = (key: string, value: string) => {
      originalSetSecret(key, value)
      // Save to all layers in parallel
      Promise.all(layers.map(layer => layer.saveSecrets({ [key]: value })))
    }

    space.saveAllSecrets = (secrets: Record<string, string>) => {
      originalSaveAllSecrets(secrets)
      // Save to all layers in parallel
      Promise.all(layers.map(layer => layer.saveSecrets(secrets)))
    }
  }
}
```

### Sync Models

The persistence system supports two distinct sync models:

#### One-Way Persistence (Write-Only)
- **Use Case**: Local storage, database persistence, backup
- **Behavior**: Saves operations without listening for incoming changes
- **Examples**: IndexedDB (client), SQLite (server)
- **Properties**: `supportsIncomingSync = false`

#### Two-Way Persistence (Bidirectional Sync) 
- **Use Case**: Real-time collaboration, server sync, peer-to-peer
- **Behavior**: Saves operations AND receives incoming changes from other sources
- **Examples**: WebSocket server sync, future P2P protocols
- **Properties**: `supportsIncomingSync = true`, implements `startListening()` and `stopListening()`

### Concrete Persistence Layer Implementations

#### IndexedDBPersistenceLayer (One-way)
Wraps existing `localDb.ts` functionality:
```typescript
class IndexedDBPersistenceLayer implements PersistenceLayer {
  readonly supportsIncomingSync = false // One-way persistence only
  readonly id = `indexeddb-${this.spaceId}`
  readonly type = 'local' as const
  
  constructor(private spaceId: string) {}
  
  async loadSpaceTreeOps(): Promise<VertexOperation[]> {
    return await getTreeOps(this.spaceId, this.spaceId)
  }
  
  async saveTreeOps(treeId: string, ops: ReadonlyArray<VertexOperation>): Promise<void> {
    await appendTreeOps(this.spaceId, treeId, ops) // Just save locally
  }
  
  createTreeLoader(): (treeId: string) => Promise<VertexOperation[]> {
    return async (treeId: string) => {
      return await getTreeOps(this.spaceId, treeId)
    }
  }
  
  async loadSecrets(): Promise<Record<string, string> | undefined> {
    return await getAllSecrets(this.spaceId)
  }
  
  async saveSecrets(secrets: Record<string, string>): Promise<void> {
    await saveAllSecrets(this.spaceId, secrets)
  }
  
  // No startListening/stopListening methods - one-way only
}
```

#### ServerPersistenceLayer (Two-way)
For client-server bidirectional sync:
```typescript
class ServerPersistenceLayer implements PersistenceLayer {
  readonly supportsIncomingSync = true // Two-way sync
  readonly id = `server-${this.spaceId}`
  readonly type = 'remote' as const
  
  private websocket?: WebSocket
  
  constructor(
    private spaceId: string, 
    private serverUrl: string
  ) {}
  
  async loadSpaceTreeOps(): Promise<VertexOperation[]> {
    return await getSpaceTreeOps(this.spaceId, this.spaceId)
  }
  
  createTreeLoader(): (treeId: string) => Promise<VertexOperation[]> {
    return async (treeId: string) => {
      return await getSpaceTreeOps(this.spaceId, treeId)
    }
  }
  
  async saveTreeOps(treeId: string, ops: ReadonlyArray<VertexOperation>): Promise<void> {
    // Send operations to server via HTTP API
    await postSpaceTreeOps(this.spaceId, treeId, ops)
  }
  
  // Two-way sync methods
  async startListening(onIncomingOps: (treeId: string, ops: VertexOperation[]) => void): Promise<void> {
    this.websocket = new WebSocket(`${this.serverUrl}/sync/${this.spaceId}`)
    this.websocket.onmessage = (event) => {
      const { treeId, ops } = JSON.parse(event.data)
      onIncomingOps(treeId, ops) // Push incoming ops back to Space
    }
  }
  
  async stopListening(): Promise<void> {
    this.websocket?.close()
  }
}
```

#### SQLitePersistenceLayer (One-way)
For server-side database storage:
```typescript
class SQLitePersistenceLayer implements PersistenceLayer {
  readonly supportsIncomingSync = false // One-way persistence only
  readonly id = `sqlite-${this.spaceId}`
  readonly type = 'local' as const
  
  constructor(
    private spaceId: string,
    private dbPath: string
  ) {}
  
  async loadSpaceTreeOps(): Promise<VertexOperation[]> {
    return await this.loadTreeOpsFromDb(this.spaceId)
  }
  
  createTreeLoader(): (treeId: string) => Promise<VertexOperation[]> {
    return async (treeId: string) => {
      return await this.loadTreeOpsFromDb(treeId)
    }
  }
  
  async saveTreeOps(treeId: string, ops: ReadonlyArray<VertexOperation>): Promise<void> {
    await this.saveTreeOpsToDb(treeId, ops)
  }
  
  // No startListening/stopListening methods - one-way only
}

### Usage Examples

#### Client-Side Usage

```typescript
// Local-only space
const localLayer = new IndexedDBPersistenceLayer(spaceId)
const space = await spaceManager.loadSpace(spaceId, [localLayer])

// Server-synced space  
const serverLayer = new ServerPersistenceLayer(spaceId, 'https://api.t69.chat')
const space = await spaceManager.loadSpace(spaceId, [serverLayer])

// Hybrid space (local + server) - multiple layers directly
const localLayer = new IndexedDBPersistenceLayer(spaceId)
const serverLayer = new ServerPersistenceLayer(spaceId, 'https://api.t69.chat')
const space = await spaceManager.loadSpace(spaceId, [localLayer, serverLayer])
```

#### Server-Side Usage

```typescript
// Server-only space
const sqliteLayer = new SQLitePersistenceLayer(spaceId, './data/spaces')
const space = await spaceManager.loadSpace(spaceId, [sqliteLayer])
```

## Benefits

1. **Separation of Concerns**: Space contains pure business logic, persistence is separate
2. **Multiple Persistence Layers**: Directly support multiple persistence strategies per space without composite pattern complexity
3. **Testability**: Easy to mock persistence layers for testing
4. **Extensibility**: Add new persistence types without changing existing code
5. **Flexibility**: A space can be local-only, server-synced, or both simultaneously
6. **Environment Agnostic**: Same SpaceManager in core works on client and server
7. **Conflict Resolution**: RepTree handles merging operations from multiple persistence sources
8. **Lazy Loading**: Maintains existing AppTree lazy loading pattern
9. **Simplified Architecture**: No unnecessary abstraction layers or composite patterns
10. **Flexible Sync Models**: Clear distinction between one-way (write-only) and two-way (bidirectional) persistence

## Migration Plan

1. **Phase 1**: Create `PersistenceLayer` interface in core and `SpaceManager` in core
2. **Phase 2**: Implement `IndexedDBPersistenceLayer` in client wrapping existing `localDb.ts`
3. **Phase 3**: Implement `ServerPersistenceLayer` in client and `SQLitePersistenceLayer` in server
4. **Phase 4**: Update client code to use new `SpaceManager` with persistence layers
5. **Phase 5**: Update server code to use new architecture
6. **Phase 6**: Remove old `InBrowserSpaceSync` and `ServerSpaceSync` classes

## File Structure

```
packages/core/src/spaces/
├── Space.ts (unchanged)
├── AppTree.ts (unchanged)
├── SpaceManager.ts (environment-agnostic)
└── persistence/
    └── PersistenceLayer.ts (interface only)

packages/client/src/lib/spaces/
├── persistence/
│   ├── IndexedDBPersistenceLayer.ts
│   └── ServerPersistenceLayer.ts (HTTP client)
├── spaceManagerSetup.ts (thin factory functions)
└── (legacy files to be removed after migration)

packages/server/src/lib/
├── persistence/
│   └── SQLitePersistenceLayer.ts
└── spaceManagerSetup.ts (thin factory functions)
```

This refactor will significantly improve the maintainability and extensibility of the space management system while preserving all existing functionality. 