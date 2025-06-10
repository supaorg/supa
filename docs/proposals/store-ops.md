# Proposal: Store Operations Grouped by Tree IDs

## Current State

Currently, operations are stored at the space level in the `SpaceSetup` type:

```typescript
export type SpaceSetup = {
  // ... other fields
  ops?: VertexOperation[];
}
```

This approach has a fundamental limitation:

**Incorrect Operation Storage**: We cannot correctly store operations for spaces because operations from different trees (the main space tree + separate app trees) are mixed together in a single array, making it impossible to properly restore each tree's individual state.

## Problem Analysis

From the codebase analysis, we can see the structure:

**Current Architecture:**
- Each `Space` contains a main `RepTree` (`this.tree`) for space metadata and structure
- The space tree links to separate app-related trees stored in `app-forest`
- Each AI conversation is stored as a separate `AppTree` with its own `RepTree` instance
- Each RepTree generates operations via methods like `getAllOps()`, `popLocalOps()`, and consumes them via `merge(ops)`

**RepTree Operations:**
Operations are generated when we move vertices or set properties:
- `VertexOperation = MoveVertex | SetVertexProperty`
- `MoveVertex`: Generated when moving vertices - `{ id: OpId, targetId: string, parentId: string | null }`  
- `SetVertexProperty`: Generated when setting properties - `{ id: OpId, targetId: string, key: string, value: VertexPropertyTypeInOperation, transient: boolean }`
- `OpId`: `{ counter: number, peerId: string }`

**Current Problem:**
All operations from all trees (main space tree + separate app trees) are stored together in a single `ops` array at the space level. This is fundamentally incorrect because:

1. **Cannot restore individual trees**: Each RepTree needs its own specific operations to recreate its state
2. **Operations get applied to wrong trees**: When loading, there's no way to know which operations belong to which tree
3. **Data corruption**: Mixed operations from different trees cannot be properly applied during tree initialization

## Proposed Solution

### 1. New Database Schema

Replace the current `ops` field in `SpaceSetup` with a separate table for operations:

```typescript
// Remove ops from SpaceSetup
export type SpaceSetup = {
  id: string;
  uri: string;
  name: string | null;
  createdAt: Date;
  ttabsLayout?: string | null;
  theme?: string | null;
  colorScheme?: 'light' | 'dark' | null;
  drafts?: { [draftId: string]: string } | null;
  // ops field removed
};

// New table for operations
export interface TreeOperations {
  id?: number; // Auto-increment primary key
  spaceId: string; // Reference to the space
  treeId: string; // ID of the specific tree
  operation: VertexOperation; // The actual operation (union type: MoveVertex | SetVertexProperty)
}
```

### 2. Database Structure Changes

Update the Dexie schema:

```typescript
class LocalDb extends Dexie {
  spaces!: Dexie.Table<SpaceSetup, string>;
  config!: Dexie.Table<ConfigEntry, string>;
  treeOps!: Dexie.Table<TreeOperations, number>;
  
  constructor() {
    super('localDb');
    this.version(2).stores({
      spaces: '&id, uri, name, createdAt',
      config: '&key',
      treeOps: '++id, spaceId, treeId, [spaceId+treeId]'
    });
  }
}
```

### 3. Key Features

- **Compound Index**: `[spaceId+treeId]` for efficient querying of operations by specific tree
- **Separate Storage**: Each tree's operations are logically separated
- **Minimal Overhead**: No additional metadata per operation

### 4. API Changes

New functions to replace the current ops handling:

```typescript
// Replace getSpaceOps - get operations for a specific tree
export async function getTreeOps(spaceId: string, treeId: string): Promise<VertexOperation[]>

// Replace saveSpaceOps - save operations for a specific tree
export async function saveTreeOps(spaceId: string, treeId: string, ops: VertexOperation[]): Promise<void>

// New: Append operations from RepTree.popLocalOps() to storage
export async function appendTreeOps(spaceId: string, treeId: string, ops: VertexOperation[]): Promise<void>

// New: Get operations for all trees in a space (for migration/debugging)
export async function getAllSpaceTreeOps(spaceId: string): Promise<Map<string, VertexOperation[]>>

// New: Delete operations for a specific tree
export async function deleteTreeOps(spaceId: string, treeId: string): Promise<void>

// New: Get operation count for a tree (for UI/debugging)
export async function getTreeOpCount(spaceId: string, treeId: string): Promise<number>
```

**Usage Pattern:**
```typescript
// Loading a tree: get ops from storage and merge into RepTree
const ops = await getTreeOps(spaceId, treeId);
const tree = new RepTree(peerId, ops); // RepTree handles union type deserialization

// Saving changes: get local ops from RepTree and append to storage  
const localOps = tree.popLocalOps(); // Returns properly typed VertexOperation[]
if (localOps.length > 0) {
  await appendTreeOps(spaceId, treeId, localOps);
}

// If manual type checking needed:
import { isMoveVertexOp, isAnyPropertyOp } from 'reptree';
ops.forEach(op => {
  if (isMoveVertexOp(op)) {
    // op is now typed as MoveVertex
    console.log('Move:', op.targetId, 'to', op.parentId);
  } else if (isAnyPropertyOp(op)) {
    // op is now typed as SetVertexProperty  
    console.log('Set property:', op.key, '=', op.value);
  }
});
```

### 5. Migration Strategy

Since this is a breaking change to the database schema:

1. **Version Bump**: Increment database version to 2
2. **Migration Function**: Convert existing space-level ops to tree-level ops
3. **Fallback Handling**: For existing spaces without clear tree separation, assign all ops to the main space tree ID

```typescript
// Migration logic in database version upgrade
this.version(2).stores({
  spaces: '&id, uri, name, createdAt',
  config: '&key',
  treeOps: '++id, spaceId, treeId, [spaceId+treeId]'
}).upgrade(trans => {
  // Migrate existing ops from spaces to treeOps table
  return trans.spaces.toCollection().modify(space => {
    if (space.ops && space.ops.length > 0) {
      // Assign all existing ops to main space tree
      const mainTreeId = space.id; // or derive from space structure
      space.ops.forEach((op) => {
        trans.treeOps.add({
          spaceId: space.id,
          treeId: mainTreeId,
          operation: op
        });
      });
      delete space.ops;
    }
  });
});
```

## Benefits

1. **Correctness**: Each tree gets its own operations, enabling proper state restoration
2. **Data Integrity**: Operations are applied to the correct trees during initialization  
3. **Proper Tree Isolation**: Each RepTree (space tree, conversation trees) maintains its own operation history
4. **Efficient Loading**: Only load operations for the specific tree being initialized
5. **Clean Storage**: Minimal overhead with no additional metadata per operation

## Considerations

1. **Breaking Change**: Requires database migration
2. **Complexity**: Slightly more complex API surface
3. **Tree ID Management**: Need to ensure tree IDs are properly tracked and managed
4. **Union Type Storage**: VertexOperation is a union type (MoveVertex | SetVertexProperty). While Dexie/IndexedDB can store the objects, deserialization requires type guards to restore correct TypeScript types. Fortunately, RepTree provides `isMoveVertexOp()` and `isAnyPropertyOp()` helper functions for this purpose.

## Implementation Plan

1. Create migration script for database schema
2. Update `localDb.ts` with new table and API functions
3. Update Space.ts and related code to use tree-specific operation storage
4. Add tests for the new functionality
5. Update any UI code that relies on the old ops structure

## Alternatives Considered

1. **Nested Object Structure**: Store ops as `{[treeId]: VertexOperation[]}` in SpaceSetup
   - Rejected: Still requires loading all operations when only one tree is needed
2. **Separate Databases per Space**: Create a new database for each space
   - Rejected: Adds complexity and potential for database proliferation
3. **File-based Storage**: Store operations in separate files
   - Rejected: Doesn't fit well with the current IndexedDB approach 