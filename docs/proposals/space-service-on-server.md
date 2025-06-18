# Space Service on Server

## Overview

This proposal outlines the implementation of a `SpaceService` to manage space metadata on the server, providing a central registry of spaces while maintaining the current architecture of individual space databases.

## Current State

- Each space has its own SQLite database containing operations (`./data/spaces/{partition}/{spaceId}.db`)
- No central registry of available spaces
- Space routes directly instantiate `ServerSpaceSync` without metadata validation
- No easy way to list all spaces or check ownership

## Proposed Changes

### 1. SpaceService Implementation

Create a new `SpaceService` class that:
- Manages space metadata in the central `platform.db`
- Provides CRUD operations for spaces
- Integrates with existing `ServerSpaceSync` functionality
- Handles space permissions and ownership validation

### 2. Database Schema Updates

Add spaces metadata table to `platform.db`:

```sql
CREATE TABLE IF NOT EXISTS spaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_spaces_owner ON spaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_spaces_created_at ON spaces(created_at);
```

### 3. Services Architecture

Refactor server initialization to use a services pattern:

```typescript
// services/index.ts
export interface Services {
  auth: AuthService;
  spaces: SpaceService;
}

export function createServices(db: Database): Services {
  return {
    auth: new AuthService(db),
    spaces: new SpaceService(db)
  };
}
```

### 4. SpaceService API

```typescript
export class SpaceService {
  constructor(private db: Database) {}
  
  // Space metadata management
  async createSpace(name: string, ownerId: string): Promise<SpaceMetadata>
  async getSpace(spaceId: string): Promise<SpaceMetadata | null>
  async listUserSpaces(userId: string): Promise<SpaceMetadata[]>
  async updateSpace(spaceId: string, updates: Partial<SpaceMetadata>): Promise<void>
  async deleteSpace(spaceId: string): Promise<void>
  
  // Permission checks
  async canUserAccessSpace(userId: string, spaceId: string): Promise<boolean>
  async isSpaceOwner(userId: string, spaceId: string): Promise<boolean>
  
  // Integration with ServerSpaceSync
  async createNewSpace(name: string, ownerId: string): Promise<{
    metadata: SpaceMetadata;
    sync: ServerSpaceSync;
  }>
  
  async loadSpace(spaceId: string): Promise<ServerSpaceSync>
}
```

### 5. Route Updates

Update space routes to:
- Use SpaceService for metadata operations
- Validate permissions before space operations
- Return enriched space information with metadata

## Implementation Plan

### Phase 1: Core Infrastructure
1. Create `SpaceService` class in `src/services/space.service.ts`
2. Update database schema in `Database` class
3. Implement services pattern in `server.ts`

### Phase 2: Space Management
1. Implement space CRUD operations in `SpaceService`
2. Add permission checking methods
3. Update space routes to use `SpaceService`

### Phase 3: Integration
1. Integrate `SpaceService` with `ServerSpaceSync`
2. Add space listing endpoints
3. Update error handling for space operations

## Benefits

1. **Central Management**: All space metadata in one place for easy querying
2. **Permission Control**: Built-in ownership and access validation
3. **Scalability**: Easy to add features like sharing, collaboration, etc.
4. **Consistency**: Unified service pattern across the application
5. **Performance**: Fast space listing without scanning individual databases

## Migration Strategy

- Existing spaces will need to be migrated to the new metadata table
- Create migration script to scan existing space databases and populate metadata
- Maintain backward compatibility during transition

## API Changes

### New Endpoints
- `GET /spaces` - List user's spaces
- `PUT /spaces/:id` - Update space metadata
- `DELETE /spaces/:id` - Delete space and all data

### Updated Endpoints
- `POST /spaces` - Enhanced with name parameter
- `GET /spaces/:id` - Returns metadata + operations

## Example Usage

```typescript
// Create a new space
const { metadata, sync } = await services.spaces.createNewSpace("My Project", userId);

// List user's spaces
const userSpaces = await services.spaces.listUserSpaces(userId);

// Load existing space with permission check
if (await services.spaces.canUserAccessSpace(userId, spaceId)) {
  const sync = await services.spaces.loadSpace(spaceId);
}
```

## Security Considerations

- All space operations require authentication
- Ownership validation before destructive operations
- Space access control for future sharing features
- Rate limiting on space creation

## Future Extensions

- Space sharing and collaboration
- Space templates
- Space archiving/backup
- Usage analytics and quotas 