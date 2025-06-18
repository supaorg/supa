# Long Polling Synchronization Proposal

## Problem Statement

Currently, t69 spaces only support local persistence and basic REST API operations. Users cannot collaborate in real-time on the same space. When multiple users edit the same space, changes are not synchronized between clients, leading to potential conflicts and data loss.

## Proposed Solution

Implement real-time collaboration using a long polling approach that leverages RepTree's built-in state vector functionality. This solution provides near real-time synchronization while being simpler than WebSocket/Socket.IO implementations.

## Background: RepTree State Vectors

RepTree (our underlying CRDT implementation) provides built-in state vector support:

- `getStateVector()`: Returns current state as `Record<string, number[][]>`
- `getMissingOps(stateVector)`: Returns operations missing from the provided state vector
- State vectors represent operation ranges per peer (e.g., `{"peer1": [[0, 10], [15, 20]]}`)

## Architecture Overview

### Current Flow
```
User Edit → RepTree VertexOperation → SpaceSync observes → Local persistence
```

### Proposed Flow
```
User Edit → RepTree VertexOperation → SpaceSync observes → Local persistence + Server sync
Server sync: Send state vector → Receive missing ops → Apply to local RepTree
```

## API Design

### 1. Sync Endpoint (Long Polling)
```
POST /spaces/:id/sync
Content-Type: application/json
Authorization: Bearer <token>

Request Body:
{
  "stateVectors": {
    "treeId1": {"peer1": [[0, 10]], "peer2": [[0, 5]]},
    "treeId2": {"peer1": [[0, 15]]}
  },
  "timeout": 30000  // optional, max wait time in ms
}

Response (when operations available):
{
  "operations": {
    "treeId1": [
      {
        "id": "op123",
        "operation": {...},  // RepTree VertexOperation
        "timestamp": 1234567890
      }
    ]
  }
}

Response (on timeout):
{
  "operations": {}
}
```

### 2. Submit Operations Endpoint
```
PUT /spaces/:id/operations
Content-Type: application/json
Authorization: Bearer <token>

Request Body:
{
  "treeId": "tree123",
  "operations": [
    {
      "operation": {...},  // RepTree VertexOperation
      "timestamp": 1234567890
    }
  ]
}

Response:
{
  "success": true,
  "applied": 1
}
```

## Implementation Details

### Server Side (`packages/server`)

#### 1. Extend Space Service
```typescript
class SpaceService {
  // Store pending operations per space/tree
  private pendingOperations: Map<string, Map<string, Operation[]>> = new Map();
  
  // Store active polling requests
  private pollingRequests: Map<string, PendingRequest[]> = new Map();

  async syncSpace(spaceId: string, stateVectors: StateVectors, timeout: number) {
    const space = await this.getSpaceWithTrees(spaceId);
    const missingOps = this.getMissingOperations(space, stateVectors);
    
    if (Object.keys(missingOps).length > 0) {
      return { operations: missingOps };
    }
    
    // Long polling: wait for new operations
    return this.waitForOperations(spaceId, stateVectors, timeout);
  }

  private getMissingOperations(space: Space, stateVectors: StateVectors) {
    const result = {};
    
    for (const [treeId, stateVector] of Object.entries(stateVectors)) {
      const tree = space.trees.get(treeId);
      if (tree) {
        const missingOps = tree.getMissingOps(stateVector);
        if (missingOps.length > 0) {
          result[treeId] = missingOps.map(op => ({
            operation: op,
            timestamp: Date.now()
          }));
        }
      }
    }
    
    return result;
  }

  async submitOperations(spaceId: string, treeId: string, operations: Operation[]) {
    const space = await this.getSpace(spaceId);
    const tree = space.trees.get(treeId);
    
    let applied = 0;
    for (const op of operations) {
      try {
        // Apply operation to RepTree
        tree.applyOperation(op.operation);
        applied++;
        
        // Store for persistence
        await this.persistOperation(spaceId, treeId, op);
        
        // Notify waiting polling requests
        this.notifyPollingRequests(spaceId, treeId, op);
      } catch (error) {
        console.error('Failed to apply operation:', error);
      }
    }
    
    return { success: true, applied };
  }
}
```

#### 2. Add Routes
```typescript
// In space.routes.ts
router.post('/spaces/:id/sync', authenticateToken, async (req, res) => {
  try {
    const { stateVectors, timeout = 30000 } = req.body;
    const result = await spaceService.syncSpace(req.params.id, stateVectors, timeout);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/spaces/:id/operations', authenticateToken, async (req, res) => {
  try {
    const { treeId, operations } = req.body;
    const result = await spaceService.submitOperations(req.params.id, treeId, operations);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Client Side (`packages/client`)

#### 1. Extend InBrowserSpaceSync
```typescript
class InBrowserSpaceSync implements SpaceConnection {
  private syncInterval: number | null = null;
  private syncTimeout = 30000; // 30 seconds

  async startSync() {
    if (this.syncInterval) return;
    
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, 1000); // Check every second if sync is needed
  }

  async stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private async performSync() {
    try {
      const stateVectors = this.getCurrentStateVectors();
      const response = await this.api.post(`/spaces/${this.spaceId}/sync`, {
        stateVectors,
        timeout: this.syncTimeout
      });

      if (response.operations && Object.keys(response.operations).length > 0) {
        await this.applyRemoteOperations(response.operations);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  private getCurrentStateVectors(): Record<string, any> {
    const stateVectors = {};
    
    for (const [treeId, tree] of this.space.trees) {
      stateVectors[treeId] = tree.getStateVector();
    }
    
    return stateVectors;
  }

  private async applyRemoteOperations(operations: Record<string, Operation[]>) {
    for (const [treeId, ops] of Object.entries(operations)) {
      const tree = this.space.trees.get(treeId);
      if (tree) {
        for (const op of ops) {
          try {
            tree.applyOperation(op.operation);
          } catch (error) {
            console.error('Failed to apply remote operation:', error);
          }
        }
      }
    }
  }

  protected async persistOperation(op: VertexOperation, treeId: string) {
    // Existing local persistence
    await super.persistOperation(op, treeId);
    
    // Submit to server
    try {
      await this.api.put(`/spaces/${this.spaceId}/operations`, {
        treeId,
        operations: [{
          operation: op,
          timestamp: Date.now()
        }]
      });
    } catch (error) {
      console.error('Failed to submit operation to server:', error);
    }
  }
}
```

## Sync Flow

### 1. User Makes Edit
```
1. User types in chat app
2. RepTree generates VertexOperation
3. InBrowserSpaceSync.persistOperation() called
4. Operation saved to IndexedDB (local)
5. Operation submitted to server via PUT /operations
6. Server applies operation to its RepTree instance
7. Server notifies any waiting long polling requests
```

### 2. Receiving Updates
```
1. Client sends POST /sync with current state vectors
2. Server checks for missing operations using RepTree.getMissingOps()
3. If operations available: return immediately
4. If no operations: wait up to timeout period
5. Return operations when available or empty on timeout
6. Client applies operations to local RepTree
7. UI updates automatically via RepTree reactivity
```

## Benefits

1. **Simple Implementation**: Uses existing REST infrastructure
2. **Efficient**: Only transfers missing operations based on state vectors
3. **Built-in Conflict Resolution**: Leverages RepTree's CRDT properties
4. **Scalable**: No persistent connections, stateless server
5. **Reliable**: HTTP-based, works through proxies and firewalls
6. **Auth Integration**: Uses existing JWT authentication
7. **Error Handling**: Standard HTTP error codes and retry logic

## Potential Enhancements

1. **Batching**: Group multiple operations before sending
2. **Compression**: Compress operation payloads for large changes
3. **Selective Trees**: Only sync specific trees user is viewing
4. **Adaptive Polling**: Adjust poll frequency based on activity
5. **Connection Quality**: Detect network issues and adjust timeouts

## Implementation Timeline

1. **Phase 1**: Basic sync endpoint with immediate responses
2. **Phase 2**: Add long polling support
3. **Phase 3**: Client-side integration and testing
4. **Phase 4**: Optimization and error handling
5. **Phase 5**: UI indicators for sync status

## Risks and Mitigations

1. **Server Load**: Long polling can consume server resources
   - *Mitigation*: Implement reasonable timeouts and connection limits
   
2. **Network Issues**: Poor connections may cause frequent timeouts
   - *Mitigation*: Adaptive retry logic and offline support
   
3. **Large Operations**: Big changes might cause sync delays
   - *Mitigation*: Operation size limits and chunking

4. **Clock Skew**: Different client/server times
   - *Mitigation*: Use logical timestamps from RepTree, not wall clock

## Conclusion

This long polling approach provides real-time collaboration with minimal complexity. It leverages RepTree's existing state vector capabilities and integrates cleanly with the current architecture. The implementation is straightforward, maintainable, and provides a solid foundation for collaborative editing in t69. 