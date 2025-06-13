# Proposal: SQLite Storage for Server Operations

## Current State
- **Client**: IndexedDB via Dexie with `TreeOperation` schema
- **Server**: No persistent storage yet
- **Shared**: TypeScript everywhere, `packages/core` exists

## Proposed Approaches

### Option 1: Shared Schema + Adapter Pattern

**Structure:**
```
packages/core/
  ├── storage/TreeOperation.ts      # Shared interface
  ├── storage/IOperationStore.ts    # Common interface
  └── storage/conversion.ts         # Shared conversion logic

packages/client/src/lib/
  └── adapters/IndexedDBAdapter.ts

packages/server/src/lib/
  └── adapters/SQLiteAdapter.ts
```

**Benefits:** Maximum code reuse, consistent API
**Drawbacks:** Abstraction overhead

### Option 2: SQLite Explicit Schema

```sql
CREATE TABLE tree_operations (
  clock INTEGER NOT NULL,
  peer_id TEXT NOT NULL,
  tree_id TEXT NOT NULL,
  space_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  
  -- Move operation
  parent_id TEXT,
  
  -- Property operation  
  key TEXT,
  value TEXT,
  transient BOOLEAN DEFAULT FALSE,
  
  PRIMARY KEY (clock, peer_id, tree_id, space_id)
);

-- Indexes for common queries
CREATE INDEX idx_space_tree ON tree_operations(space_id, tree_id);
CREATE INDEX idx_space_tree_clock ON tree_operations(space_id, tree_id, clock);
CREATE INDEX idx_peer ON tree_operations(peer_id);
```

**Benefits:** Simple, explicit, efficient, matches client schema closely
**Drawbacks:** None significant for our use case

### Option 3: Direct Dexie-like Interface

```typescript
// packages/server/src/lib/SqliteDb.ts
class SqliteDb {
  async getTreeOps(spaceId: string, treeId: string): Promise<VertexOperation[]>
  async appendTreeOps(spaceId: string, treeId: string, ops: VertexOperation[]): Promise<void>
  // ... same API as localDb.ts
}
```

**Benefits:** Minimal changes, familiar API
**Drawbacks:** Doesn't leverage SQLite indexing potential

### Option 4: Hybrid Approach

```typescript
// packages/core/storage/IOperationRepository.ts
interface OperationRepository {
  getTreeOps(spaceId: string, treeId: string): Promise<VertexOperation[]>
  appendTreeOps(spaceId: string, treeId: string, ops: VertexOperation[]): Promise<void>
  getOpsAfterClock(spaceId: string, treeId: string, clock: number): Promise<VertexOperation[]>
}

// Client implementation uses current TreeOperation schema
// Server implementation uses explicit SQLite schema
```

## Recommendation

**Option 4 (Hybrid)** with explicit SQLite schema:

1. **Core package** with `OperationRepository` interface and conversion utilities
2. **Client** keeps current `TreeOperation` schema (works well with IndexedDB)
3. **Server** uses explicit SQLite columns (simple, fast, type-safe)
4. **Both** implement same interface for consistency

The explicit column approach is optimal for our simple, stable operation types. 