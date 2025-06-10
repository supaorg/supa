# Proposal: Store Operations Grouped by Tree IDs

## Current State

Currently, operations are stored at the space level in the `SpaceSetup` type:

```typescript
export type SpaceSetup = {
  // ... other fields
  ops?: VertexOperation[];
}
```

This approach has several limitations:

1. **Inefficient retrieval**: When we need operations for a specific tree, we have to load all operations for the entire space
2. **Poor scalability**: As spaces grow and contain multiple trees, the ops array becomes large and unwieldy
3. **Lack of granularity**: Operations from different trees (main space tree + multiple app trees) are mixed together

## Problem Analysis

From `Space.ts`, we can see that each space contains:
- A main space tree (`this.tree`)
- Multiple app trees (`appTrees: Map<string, AppTree>`)
- Each tree has its own unique ID

Each tree operates independently and should have its operations stored separately for optimal performance.

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
  operation: VertexOperation; // The actual operation
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
// Replace getSpaceOps
export async function getTreeOps(spaceId: string, treeId: string): Promise<VertexOperation[]>

// Replace saveSpaceOps  
export async function saveTreeOps(spaceId: string, treeId: string, ops: VertexOperation[]): Promise<void>

// New: Append single operation
export async function appendTreeOp(spaceId: string, treeId: string, op: VertexOperation): Promise<void>

// New: Get operations for all trees in a space
export async function getAllSpaceTreeOps(spaceId: string): Promise<Map<string, VertexOperation[]>>

// New: Delete operations for a specific tree
export async function deleteTreeOps(spaceId: string, treeId: string): Promise<void>

// New: Get operation count for a tree
export async function getTreeOpCount(spaceId: string, treeId: string): Promise<number>
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

1. **Performance**: O(1) lookup for tree-specific operations via compound index
2. **Scalability**: Operations are distributed across trees rather than concentrated
3. **Flexibility**: Each tree can be managed independently
4. **Memory Efficiency**: Only load operations for trees that are actively being used
5. **Clean Storage**: Minimal overhead with no additional metadata per operation

## Considerations

1. **Breaking Change**: Requires database migration
2. **Complexity**: Slightly more complex API surface
3. **Tree ID Management**: Need to ensure tree IDs are properly tracked and managed

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