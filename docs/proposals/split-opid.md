# Proposal: Split Operation ID for Better Storage and Querying

## Current State

Currently, we store tree operations with the following schema:

```typescript
interface TreeOperations {
  opId: string; // "123@some-uuid" 
  spaceId: string;
  treeId: string;
  operation: VertexOperation; // Contains the full operation object including embedded ID
}
```

Where `VertexOperation` contains:
```typescript
{
  id: { counter: 123, peerId: "some-uuid" },
  // ... operation data
}
```

## Problems with Current Approach

1. **Limited Query Capabilities**: Can't efficiently query operations by clock range (e.g., "get all ops after counter 100")
2. **Redundant Data**: Operation ID is stored both as string key and embedded in the operation object
3. **String Parsing**: Need to parse `"123@some-uuid"` to extract counter/peerId
4. **Storage Overhead**: Duplicated ID information takes extra space

## Proposed Solution

### New Database Schema

```typescript
interface TreeOperation {
  // Composite primary key components
  clock: number;        // The counter/clock value
  peerId: string;       // The peer ID
  treeId: string;       // Tree identifier
  
  // Operation metadata
  spaceId: string;      // Space reference
  targetId: string;     // Target vertex ID
  
  // Move operation: has parentId
  parentId?: string;    // For move operations
  
  // Property operation: has key/value/transient  
  key?: string;         // Property key
  value?: any;          // Property value
  transient?: boolean;  // Whether property is transient
}
```

### Database Configuration

```typescript
this.version(3).stores({
  spaces: '&id, uri, name, createdAt',
  config: '&key',
  treeOps: '&[clock+peerId+treeId], spaceId, treeId, [spaceId+treeId], [spaceId+treeId+clock]'
});
```

## Benefits

1. **Range Queries**: Efficient queries like "get ops with clock > 100 for tree X"
2. **Leaner Storage**: No redundant ID storage
3. **Better Indexing**: Separate numeric clock field allows for efficient sorting/filtering  
4. **Type Safety**: Explicit operation types instead of union types
5. **Faster Parsing**: No string splitting needed

## Implementation Considerations

### Implementation Path
- Version 3 schema with new table structure
- No migration needed since we're in WIP phase

### Query Examples
```typescript
// Get operations after specific clock
await db.treeOps
  .where('[spaceId+treeId+clock]')
  .between([spaceId, treeId, minClock], [spaceId, treeId, Infinity])
  .toArray();

// Get operations from specific peer
await db.treeOps
  .where('peerId')
  .equals(targetPeerId)
  .toArray();
```

### Conversion Functions
```typescript
// Convert to VertexOperation for RepTree
function toVertexOperation(op: TreeOperation): VertexOperation {
  if (op.parentId !== undefined) {
    // Move operation detected by presence of parentId
    return {
      id: { counter: op.clock, peerId: op.peerId },
      targetId: op.targetId,
      parentId: op.parentId
    } as MoveVertex;
  } else {
    // Property operation detected by presence of key
    return {
      id: { counter: op.clock, peerId: op.peerId },
      targetId: op.targetId,
      key: op.key!,
      value: op.value,
      transient: op.transient || false
    } as SetVertexProperty;
  }
}

// Convert from VertexOperation for storage
function fromVertexOperation(op: VertexOperation, spaceId: string, treeId: string): TreeOperation {
  const base = {
    clock: op.id.counter,
    peerId: op.id.peerId,
    treeId,
    spaceId,
    targetId: op.targetId
  };

  if ('parentId' in op) {
    return { ...base, parentId: op.parentId };
  } else {
    return { 
      ...base, 
      key: op.key, 
      value: op.value, 
      transient: op.transient 
    };
  }
}
```

## Questions for Review

1. Should we keep backward compatibility or is a clean break acceptable?
2. Are there other query patterns we should optimize for?
3. Should we add additional indexes for common query patterns?
4. Any concerns about the flattened operation structure? 