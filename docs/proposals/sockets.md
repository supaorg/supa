# Socket.IO Integration for Real-Time Space Collaboration

## Overview

Integrate Socket.IO with our existing space system to enable real-time collaborative editing using RepTree operations. This will allow multiple users to work together in the same space with live updates.

## Current State

**Existing Infrastructure:**
- ✅ REST API for space CRUD operations (`/spaces/*`)
- ✅ RepTree sync system with `VertexOperation[]` arrays
- ✅ `ServerSpaceSync` with `appendTreeOps(treeId, ops)` and `loadTreeOps(treeId)`
- ✅ Space/AppTree architecture (main tree + multiple app trees per space)
- ✅ Space access control (`canUserAccessSpace`, `isSpaceOwner`)
- ✅ JWT authentication middleware
- ✅ Socket.IO server with authentication

**Current Limitations:**
- No real-time updates - users must refresh to see changes
- Operations are only synced via REST API calls
- No collaborative editing capabilities

## Proposed Solution

### 1. Space Connection Workflow

```typescript
// Client connects to a space
socket.emit('join-space', spaceId)

// Server validates access and joins room
// Client receives confirmation
socket.on('joined-space', { spaceId })

// Client can now send/receive operations for this space
```

### 2. Operation Broadcasting

**Sending Operations:**
```typescript
// Client sends RepTree operations to a specific tree within a space
socket.emit('space-operations', {
  spaceId: 'space_123',
  treeId: 'space_123',  // Main space tree (spaceId === treeId)
  operations: [
    {
      id: { counter: 42, peerId: 'client_456' },
      targetId: 'vertex_789',
      key: 'content',
      value: 'Hello World'
    }
  ] as VertexOperation[]
})

// Or for an AppTree within the space
socket.emit('space-operations', {
  spaceId: 'space_123',
  treeId: 'app_tree_456',  // Specific AppTree ID
  operations: [/* VertexOperation[] */]
})
```

**Receiving Operations:**
```typescript
// All other users in space receive the operations
socket.on('space-operations-received', {
  spaceId: 'space_123',
  treeId: 'space_123',
  operations: VertexOperation[],
  fromUserId: 'user_456',
  fromUserName: 'Alice',
  timestamp: '2025-06-18T09:30:00Z'
})
```

### 3. Integration Points

**Server-Side (`socket.ts`):**
- ✅ Already implemented basic space operations
- ✅ Authentication middleware
- ✅ Room management (`space-${spaceId}`)

**Enhancements Needed:**
1. **Operation Persistence** - Use existing `ServerSpaceSync.appendTreeOps()`
2. **Operation Broadcasting** - Integrate with existing `space-operation` handler
3. **Tree-Specific Operations** - Handle both main space tree and AppTree operations
4. **VertexOperation Validation** - Ensure operations match RepTree structure

## Implementation Plan

### Phase 1: Basic Operation Sync
- [x] Socket.IO server setup
- [x] Space room management
- [ ] Client-side Socket.IO integration
- [ ] Basic operation broadcasting
- [ ] Operation persistence integration

### Phase 2: Advanced Features
- [ ] Conflict resolution for concurrent edits
- [ ] User presence indicators (who's online)
- [ ] Cursor/selection sharing
- [ ] Operation history/undo

### Phase 3: Performance & Reliability
- [ ] Operation batching for high-frequency updates
- [ ] Reconnection handling
- [ ] Offline operation queuing

## Technical Architecture

### Server Enhancement
```typescript
// In socket.ts - enhance space-operations handler
socket.on('space-operations', async (data) => {
  const { spaceId, treeId, operations } = data;
  
  // 1. Validate user access to space
  if (!services.spaces.canUserAccessSpace(socket.userId, spaceId)) {
    return socket.emit('error', { message: 'Access denied' });
  }
  
  // 2. Get ServerSpaceSync instance
  const sync = await services.spaces.loadSpace(spaceId);
  
  // 3. Validate VertexOperation[] structure
  // operations should be valid VertexOperation array
  
  // 4. Persist operations to database
  await sync.appendTreeOps(treeId, operations);
  
  // 5. Broadcast to other users in space (excluding sender)
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
// New Socket service for SvelteKit
class SpaceSocketService {
  connect(spaceId: string, authToken: string)
  sendOperations(treeId: string, operations: VertexOperation[])
  onOperationsReceived(callback: (data: {
    spaceId: string,
    treeId: string,
    operations: VertexOperation[],
    fromUserId: string
  }) => void)
  disconnect()
}
```

## Benefits

1. **Real-Time Collaboration** - Multiple users can edit simultaneously
2. **Immediate Feedback** - Changes appear instantly for all users
3. **Better UX** - No need to refresh or manually sync
4. **Leverages Existing System** - Builds on current RepTree/Space architecture
5. **Scalable** - Socket.IO rooms naturally scale with spaces

## Considerations

**Security:**
- All operations go through existing access control
- JWT authentication for socket connections
- Validate all operations server-side

**Performance:**
- Operations are lightweight RepTree ops
- Room-based broadcasting (only to users in space)
- Can add operation batching if needed

**Reliability:**
- Socket.IO handles reconnection automatically
- Operations are persisted to database
- Can implement offline queuing

## Success Metrics

- Multiple users can edit the same space simultaneously
- Operations appear in real-time (< 100ms latency)
- No data loss during concurrent editing
- Graceful handling of network interruptions

## Next Steps

1. ✅ Complete Socket.IO server setup
2. 🔲 Build client-side Socket.IO service
3. 🔲 Integrate with existing RepTree sync
4. 🔲 Add operation persistence
5. 🔲 Test collaborative editing scenarios 