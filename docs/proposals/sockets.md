# Socket.IO Integration for Real-Time Space Collaboration with State Vector Sync

## Current Space Implementation Overview

### Core Architecture

**Space.ts** - The main Space class that wraps a RepTree:
- Contains the main space tree (RepTree) that stores space metadata, app configs, settings
- Manages multiple AppTrees (each with their own RepTree) for different applications
- Handles secrets/API keys storage
- Provides methods to create, load, and manage app trees within the space

**SpaceConnection Interface** - Abstraction for space synchronization:
- `InBrowserSpaceSync` - Client-side implementation with local persistence
- `ServerSpaceSync` - Server-side implementation with SQLite persistence
- Both handle RepTree operation persistence and real-time observation

### Current Flow

**Space Creation:**
```typescript
// Client creates local space
createNewLocalSpace() 
  → InBrowserSpaceSync(Space.newSpace()) 
  → Persists to IndexedDB via SpacePersistenceQueue

// Client creates synced space  
createNewSyncedSpace()
  → POST /spaces (server creates ServerSpaceSync)
  → Returns initial operations
  → Client creates InBrowserSpaceSync from those operations
```

**Operation Flow:**
```typescript
// User modifies space → RepTree generates VertexOperation → SpaceSync observes → Persists locally
User edit → Space.tree.setProperty() → VertexOperation → InBrowserSpaceSync.handleOpApplied() → SpacePersistenceQueue.addOps()

// Server side is similar but uses SQLite instead of IndexedDB
```

**Current Limitations:**
- No real-time sync between clients
- Operations only persist locally or via REST API
- Full operation history loaded on space access

## Overview

Integrate Socket.IO with our existing space system to enable real-time collaborative editing using RepTree state vectors for efficient synchronization. This approach minimizes network usage by only transferring operations that are actually missing between client and server.

## Current State

**Existing Infrastructure:**
- ✅ REST API for space CRUD operations (`/spaces/*`)
- ✅ RepTree sync system with `VertexOperation[]` arrays and state vectors
- ✅ `ServerSpaceSync` with `appendTreeOps(treeId, ops)` and `loadTreeOps(treeId)`
- ✅ `InBrowserSpaceSync` with local persistence via SpacePersistenceQueue
- ✅ Space/AppTree architecture (main tree + multiple app trees per space)
- ✅ Space access control (`canUserAccessSpace`, `isSpaceOwner`)
- ✅ JWT authentication middleware
- ✅ Socket.IO server with authentication

**Current Limitations:**
- No real-time updates - users must refresh to see changes
- Operations are only synced via REST API calls
- No collaborative editing capabilities
- Full operation history transfer on each sync

## State Vector Synchronization

### How State Vectors Work in RepTree

RepTree has built-in range-based state vector support for efficient synchronization:

```typescript
// RepTree built-in methods
tree.getStateVector(): Readonly<Record<string, number[][]>> | null
tree.getMissingOps(theirStateVector: Record<string, number[][]>): VertexOperation[]

// State vector format: Record<peerId, number[][]>
// Example: { "peer1": [[1, 5], [8, 10]], "peer2": [[1, 7]] }
// Means: peer1 has ops 1-5 and 8-10, peer2 has ops 1-7
```

**Benefits:**
- **Efficient**: Only missing operations are transferred
- **Compact**: Continuous sequences represented as single ranges
- **Handles Gaps**: Non-contiguous operations represented as separate ranges
- **Real-time**: Maintained incrementally as operations are applied
- **Built-in**: No need to implement state vector logic ourselves

### Proposed Sync Protocol

#### 1. Space Subscription & Initial Sync

```typescript
// Client subscribes to a space and sends current state vectors
socket.emit('subscribe-space', {
  spaceId: 'space_123',
  stateVectors: {
    'space_123': tree.getStateVector(),           // Main space tree
    'app_tree_456': appTree.getStateVector(),     // App tree 1
    'app_tree_789': appTree2.getStateVector()     // App tree 2
  }
})

// Server responds with missing operations for all trees
socket.on('space-sync-response', {
  spaceId: 'space_123',
  syncData: {
    'space_123': {
      missingOps: [...],              // Operations client doesn't have
      serverStateVector: {...}        // Server's current state
    },
    'app_tree_456': {
      missingOps: [...],
      serverStateVector: {...}
    }
    // ... for each tree in the space
  }
})
```

#### 2. Real-Time Operation Broadcasting

```typescript
// Client sends new operations (automatically broadcast to space subscribers)
socket.emit('space-operations', {
  spaceId: 'space_123',
  treeId: 'space_123',  // or specific app tree ID
  operations: [
    {
      id: { counter: 26, peerId: 'client_456' },
      targetId: 'vertex_def',
      key: 'title',
      value: 'New Title'
    }
  ]
})

// All other subscribers receive the operations
socket.on('space-operations-received', {
  spaceId: 'space_123',
  treeId: 'space_123',
  operations: [/* VertexOperation[] */],
  fromUserId: 'user_456',
  fromUserName: 'Alice',
  timestamp: '2025-06-18T09:30:00Z'
})
```

#### 3. Space Management

```typescript
// Unsubscribe from a space
socket.emit('unsubscribe-space', { spaceId: 'space_123' })

// Get list of subscribed spaces
socket.emit('get-subscribed-spaces')
socket.on('subscribed-spaces', { spaces: ['space_123', 'space_456'] })

// Periodic state vector sync (optional, for missed operations)
socket.emit('request-space-sync', { spaceId: 'space_123' })
```

## Implementation Plan

### Phase 1: State Vector-Based Sync
- [x] Socket.IO server setup with authentication
- [x] Space room management
- [ ] **Use RepTree's built-in getStateVector() and getMissingOps()**
- [ ] Implement space subscription endpoints
- [ ] Client-side Socket.IO integration with state vectors
- [ ] Server-side state vector sync handler

### Phase 2: Real-Time Collaboration  
- [ ] Real-time operation broadcasting
- [ ] Operation persistence integration with ServerSpaceSync
- [ ] Multi-tree sync (space tree + app trees)
- [ ] Conflict resolution for concurrent edits

### Phase 3: Advanced Features
- [ ] User presence indicators (who's online)
- [ ] Cursor/selection sharing
- [ ] Operation batching for high-frequency updates
- [ ] Offline operation queuing

## Technical Architecture

### Server Enhancement

```typescript
// Enhanced socket handlers in socket.ts
socket.on('subscribe-space', async (data) => {
  const { spaceId, stateVectors } = data;
  
  // 1. Validate user access
  if (!services.spaces.canUserAccessSpace(socket.userId, spaceId)) {
    return socket.emit('error', { message: 'Access denied' });
  }
  
  // 2. Load server space sync
  const sync = await services.spaces.loadSpace(spaceId);
  
  // 3. Calculate missing operations for each tree using RepTree's built-in method
  const syncData: Record<string, { missingOps: VertexOperation[], serverStateVector: any }> = {};
  
  // Main space tree
  if (stateVectors[spaceId]) {
    syncData[spaceId] = {
      missingOps: sync.space.tree.getMissingOps(stateVectors[spaceId]),
      serverStateVector: sync.space.tree.getStateVector()
    };
  }
  
  // App trees
  for (const [treeId, clientStateVector] of Object.entries(stateVectors)) {
    if (treeId !== spaceId) {
      const appTree = await sync.space.loadAppTree(treeId);
      if (appTree) {
        syncData[treeId] = {
          missingOps: appTree.tree.getMissingOps(clientStateVector),
          serverStateVector: appTree.tree.getStateVector()
        };
      }
    }
  }
  
  // 4. Send response with missing operations
  socket.emit('space-sync-response', {
    spaceId,
    syncData
  });
  
  // 5. Join space room for real-time updates
  await socket.join(`space-${spaceId}`);
  socket.emit('space-subscribed', { spaceId });
})

socket.on('unsubscribe-space', async (data) => {
  const { spaceId } = data;
  await socket.leave(`space-${spaceId}`);
  socket.emit('space-unsubscribed', { spaceId });
})

socket.on('space-operations', async (data) => {
  const { spaceId, treeId, operations } = data;
  
  // 1. Validate access
  if (!services.spaces.canUserAccessSpace(socket.userId, spaceId)) {
    return socket.emit('error', { message: 'Access denied' });
  }
  
  // 2. Get ServerSpaceSync instance
  const sync = await services.spaces.loadSpace(spaceId);
  
  // 3. Persist operations to database
  await sync.appendTreeOps(treeId, operations);
  
  // 4. Apply operations to server RepTree (for state vector tracking)
  if (treeId === spaceId) {
    // Main space tree
    for (const op of operations) {
      sync.space.tree.applyOperation(op);
    }
  } else {
    // App tree
    const appTree = await sync.space.loadAppTree(treeId);
    if (appTree) {
      for (const op of operations) {
        appTree.tree.applyOperation(op);
      }
    }
  }
  
  // 5. Broadcast to other space subscribers (excluding sender)
  socket.to(`space-${spaceId}`).emit('space-operations-received', {
    spaceId,
    treeId,
    operations,
    fromUserId: socket.userId,
    fromUserName: socket.userName,
    timestamp: new Date().toISOString()
  });
})
```

### Client Integration

```typescript
// New Socket service with state vector support
class SpaceSocketService {
  private socket: Socket | null = null;
  private subscribedSpaces = new Set<string>();
  
  async connect(authToken: string) {
    this.socket = io('ws://localhost:3131', {
      auth: { token: authToken }
    });
    
    this.socket.on('connect', () => {
      console.log('🔌 Connected to server');
    });
    
    this.socket.on('space-sync-response', this.handleSpaceSyncResponse.bind(this));
    this.socket.on('space-operations-received', this.handleOperationsReceived.bind(this));
    this.socket.on('space-subscribed', this.handleSpaceSubscribed.bind(this));
  }
  
  async subscribeToSpace(spaceId: string, spaceConnection: SpaceConnection) {
    if (!this.socket) throw new Error('Not connected');
    
    // Gather state vectors from all trees in the space
    const stateVectors: Record<string, any> = {};
    
    // Main space tree state vector
    const mainStateVector = spaceConnection.space.tree.getStateVector();
    if (mainStateVector) {
      stateVectors[spaceId] = mainStateVector;
    }
    
    // App tree state vectors
    for (const appTreeId of spaceConnection.space.getAppTreeIds()) {
      const appTree = await spaceConnection.space.loadAppTree(appTreeId);
      if (appTree) {
        const appStateVector = appTree.tree.getStateVector();
        if (appStateVector) {
          stateVectors[appTreeId] = appStateVector;
        }
      }
    }
    
    this.socket.emit('subscribe-space', {
      spaceId,
      stateVectors
    });
  }
  
  async unsubscribeFromSpace(spaceId: string) {
    if (!this.socket) return;
    
    this.socket.emit('unsubscribe-space', { spaceId });
    this.subscribedSpaces.delete(spaceId);
  }
  
  private handleSpaceSyncResponse(data: {
    spaceId: string,
    syncData: Record<string, { missingOps: VertexOperation[], serverStateVector: any }>
  }) {
    const spaceConnection = getSpaceConnection(data.spaceId);
    if (!spaceConnection) return;
    
    // Apply missing operations to each tree
    for (const [treeId, { missingOps }] of Object.entries(data.syncData)) {
      if (treeId === data.spaceId) {
        // Main space tree
        for (const op of missingOps) {
          spaceConnection.space.tree.applyOperation(op);
        }
      } else {
        // App tree
        spaceConnection.space.loadAppTree(treeId).then(appTree => {
          if (appTree) {
            for (const op of missingOps) {
              appTree.tree.applyOperation(op);
            }
          }
        });
      }
    }
  }
  
  private handleSpaceSubscribed(data: { spaceId: string }) {
    this.subscribedSpaces.add(data.spaceId);
    console.log(`📍 Subscribed to space: ${data.spaceId}`);
  }
  
  sendOperations(spaceId: string, treeId: string, operations: VertexOperation[]) {
    if (!this.socket || !this.subscribedSpaces.has(spaceId)) return;
    
    this.socket.emit('space-operations', {
      spaceId,
      treeId,  
      operations
    });
  }
  
  private handleOperationsReceived(data: {
    spaceId: string,
    treeId: string,
    operations: VertexOperation[],
    fromUserId: string
  }) {
    // Apply operations from other users to local RepTree
    const spaceConnection = getSpaceConnection(data.spaceId);
    if (spaceConnection && data.fromUserId !== getCurrentUserId()) {
      if (data.treeId === data.spaceId) {
        // Main space tree
        for (const op of data.operations) {
          spaceConnection.space.tree.applyOperation(op);
        }
      } else {
        // App tree
        spaceConnection.space.loadAppTree(data.treeId).then(appTree => {
          if (appTree) {
            for (const op of data.operations) {
              appTree.tree.applyOperation(op);
            }
          }
        });
      }
    }
  }
}
```

### No Custom State Vector Implementation Needed!

Since RepTree has built-in state vector support, we don't need to implement:
- `getTreeStateVector()` - use `tree.getStateVector()`
- `calculateMissingOperations()` - use `tree.getMissingOps(theirStateVector)`
- Range manipulation utilities - handled internally by RepTree

## Integration with Current Architecture

### InBrowserSpaceSync Changes

```typescript
export class InBrowserSpaceSync implements SpaceConnection {
  private socketService: SpaceSocketService | null = null;
  
  async connect(): Promise<void> {
    // ... existing connection logic
    
    // Subscribe to socket for real-time sync
    if (this.socketService) {
      await this.socketService.subscribeToSpace(this._space.getId(), this);
    }
  }
  
  async disconnect(): Promise<void> {
    // ... existing disconnect logic
    
    // Unsubscribe from socket
    if (this.socketService) {
      await this.socketService.unsubscribeFromSpace(this._space.getId());
    }
  }
  
  private handleOpAppliedFromSamePeer(tree: RepTree, op: VertexOperation) {
    // ... existing logic for persistence
    
    // Send to server via socket
    if (this.socketService && op.id.peerId === tree.peerId) {
      const treeId = tree.root!.id;
      this.socketService.sendOperations(this._space.getId(), treeId, [op]);
    }
  }
}
```

## Benefits of Using RepTree's Built-in State Vectors

1. **No Custom Implementation**: RepTree handles all state vector logic
2. **Proven & Tested**: State vector implementation is part of RepTree core
3. **Efficient**: Built-in `getMissingOps()` is optimized
4. **Consistent**: Same state vector format across all RepTree instances
5. **Future-Proof**: Updates to RepTree state vector logic benefit us automatically

## Success Metrics

- Initial space sync transfers only missing operations (not full history)
- Real-time operations appear instantly (< 100ms latency)
- Network usage scales with actual changes, not history size
- Multiple users can edit simultaneously without conflicts
- Offline/online transitions work seamlessly
- State vector synchronization is handled by RepTree's built-in methods

## Next Steps

1. 🔲 Implement space subscription endpoints (`subscribe-space`, `unsubscribe-space`)
2. 🔲 Build client-side SpaceSocketService with subscription management
3. 🔲 Use RepTree's `getStateVector()` and `getMissingOps()` methods
4. 🔲 Integrate with InBrowserSpaceSync and ServerSpaceSync
5. 🔲 Test collaborative editing scenarios with multiple trees per space
6. 🔲 Add user presence and advanced features 