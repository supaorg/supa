# Server Sync Proposal

## Overview

This proposal outlines a simple server sync architecture for t69 that maintains the current in-browser storage while adding real-time synchronization capabilities across devices and users.

## Architecture Goals

- Keep existing "in browser" storage working as-is
- Add server sync as an enhancement, not a replacement
- Simple deployment and maintenance
- Support multiple users and collaborative spaces
- Real-time updates via WebSockets

## Storage Strategy

### Local Storage (Client)
- Continue using current browser-based storage (localdb.ts)
- Local state remains the source of truth until sync occurs
- Handle conflicts by merging operations from the server. No need for any additional logic - conflict resolution already handled by RepTree

### Server Storage
- **Use RepTrees on Server**: Implement RepTree logic on server side, mirroring client-side approach
- **Schema Alignment**: Keep server database schema as close as possible to localDb.ts structure
- **Auth Database**: Single `platform.sqlite` file for user authentication
- **Space Databases**: Individual SQLite database per space, each containing RepTree data structure
- **Database Partitioning**: Store space databases in folders using first 2 chars of UUID
  - Example: Space `a1b2c3d4-...` → stored in `/data/a1/a1b2c3d4-....db`
  - Prevents directory listing slowdown with 10,000+ databases

#### Server Database Schema (per space)
Mirror the localDb.ts structure as closely as possible:
```sql
-- Match TreeOperation interface exactly
CREATE TABLE tree_ops (
    -- Composite primary key components (matching TreeOperation interface)
    clock INTEGER NOT NULL,
    peerId TEXT NOT NULL,
    treeId TEXT NOT NULL,
    spaceId TEXT NOT NULL,
    
    -- Operation data
    targetId TEXT NOT NULL,
    
    -- Optional fields for different operation types
    parentId TEXT,  -- For move operations
    key TEXT,       -- Property key
    value TEXT,     -- Property value (JSON serialized)
    
    PRIMARY KEY (clock, peerId, treeId, spaceId)
);

-- Similar to localDb.ts spaces table  
CREATE TABLE spaces (
    id TEXT PRIMARY KEY,
    created_at INTEGER,
);
```

This allows us to:
- Use same TreeOperation ↔ VertexOperation conversion logic from localDb.ts
- Leverage existing RepTree conflict resolution on server
- Keep operation storage/retrieval patterns identical
- Minimize differences between client and server RepTree implementations

## Server Architecture

### Infrastructure
- Single EC2 instance (or Docker container)
- Direct file system storage (no S3 initially)
- One server process handling multiple users/spaces

### Database Structure
```
/data/
├── platform.sqlite          # User auth, space metadata
├── a1/
│   ├── a1b2c3d4-....db      # Individual space database
│   └── a1f5e9c8-....db
├── b2/
│   ├── b2c4d6e8-....db
│   └── b2a1f3d5-....db
└── ...
```

### Authentication
- Use platform.sqlite for user management
- Store user sessions, space permissions
- Simple JWT or session-based auth

## Sync Protocol

### WebSocket Communication
- Use WebSockets for real-time bidirectional sync
- Use Socket.io

### RepTree Sync Flow
1. **Client connects**: Authenticate and subscribe to user's spaces
2. **Local changes**: Client RepTree generates operations, sends TreeOperations to server
3. **Server processing**: Server RepTree receives operations, applies them to server-side RepTree state
4. **Server broadcast**: Server sends new operations to all other connected clients in same space
5. **Client merge**: Receiving clients apply operations to their local RepTree (conflict resolution handled automatically)

This maintains RepTree's CRDT properties on both client and server, ensuring consistent state without manual conflict resolution.

## Implementation Phases

### Phase 1: Basic Server Setup
- [ ] Implement platform.sqlite with basic user auth (in packages/server) using Nodejs
- [ ] Create space database creation/management
- [ ] Basic WebSocket server with socket.io 

### Phase 2: Sync Integration
- [ ] Integrate RepTree with WebSocket sync
- [ ] Handle space subscription/unsubscription
- [ ] Implement change broadcasting
- [ ] Add basic conflict resolution

### Phase 3: Polish & Scale
- [ ] Add proper error handling and reconnection
- [ ] Implement database cleanup/archival
- [ ] Add monitoring and logging
- [ ] Performance optimizations

## Benefits of This Approach

1. **Simple deployment**: Single server instance, no complex infrastructure
2. **Incremental adoption**: Existing local storage continues working
3. **Data isolation**: Each space in its own database prevents cross-contamination
4. **Scalable partitioning**: UUID-based folder structure scales to many databases
5. **Real-time collaboration**: WebSockets enable immediate sync
6. **Offline-first**: Local storage ensures app works without connection

## Future Considerations

- **Database migrations**: Plan for schema changes across many space databases
- **Backup strategy**: Regular backups of platform.sqlite and space databases
- **Horizontal scaling**: Could shard spaces across multiple server instances later
- **S3 integration**: Move to object storage when file system becomes limiting factor
- **CDN**: Add CDN for static assets and potentially read-only space access

## Open Questions
- How can we quickly connect to sqlite databases over ssh
- What's the backup/disaster recovery strategy?
- How to handle user deletion and space cleanup?

---

*This proposal prioritizes simplicity and getting sync working quickly over perfect scalability. We can iterate and improve the architecture as usage grows.* 