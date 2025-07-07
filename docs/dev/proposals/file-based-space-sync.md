# File-Based Space Sync Persistence Layer

## Overview

Adapt the existing `OLD_LocalSpaceSync.ts` file-based synchronization system to work with the new `PersistenceLayer` architecture. This will enable local file system persistence for spaces as a **secondary persistence layer** alongside IndexedDB, providing dual persistence for reliability and cross-device sync capabilities.

## Current State Analysis

### Old System (`OLD_LocalSpaceSync.ts`)
- **Two-way sync**: File watching + operation saving
- **Directory structure**: `space-v1/ops/{treeId_prefix}/{treeId_suffix}/{YYYY}/{MM}/{DD}/{peerId}.jsonl`
- **Encrypted secrets**: AES-GCM encryption using space ID as key
- **Worker-based parsing**: Operations parsed in web worker for performance
- **Proven reliability**: Battle-tested file organization and operation storage

### New Architecture Benefits
- **Composable**: Can combine with IndexedDB, server sync, etc.
- **Separation of concerns**: File operations isolated from business logic
- **Consistent interface**: Same API across all persistence types

## Proposed Implementation

### 1. FileSystemPersistenceLayer

```typescript
class FileSystemPersistenceLayer implements PersistenceLayer {
  readonly supportsIncomingSync = true; // Enable file watching
  readonly type = 'local' as const;
  
  constructor(private spacePath: string, private spaceId: string) {}
}
```

### 2. Core Capabilities

**Directory Structure** (maintain existing format):
```
{spacePath}/
├── supa.md                    # Space marker file
└── space-v1/
    ├── space.json            # Space metadata
    ├── secrets               # Encrypted secrets file
    └── ops/
        └── {tree_id}/
            └── YYYY/MM/DD/
                └── {peer_id}.jsonl
```

**Operations**:
- **Loading**: Scan date directories, parse JSONL files using worker
- **Saving**: Append operations to current day's peer file
- **Batching**: Buffer operations and flush every 500ms (existing pattern)

**Secrets**:
- **Encryption**: AES-GCM with space ID as key (preserve existing security)
- **Auto-save**: Detect changes and save every 1000ms

### 3. Two-Way Sync Implementation

**File Watching** (Tauri only):
- Use `@tauri-apps/plugin-fs` watch API
- Monitor `.jsonl` files and `secrets` file
- Trigger callbacks for incoming operations

**Platform Detection**:
- **Tauri**: Full two-way sync with file watching
- **Web**: One-way persistence only (no file system access)

### 4. Dual Persistence Strategy

**Primary + Secondary Layers**:
- **IndexedDB**: Primary layer (fast local access, immediate availability)
- **File System**: Secondary layer (cross-device sync, backup, external access)

**Loading Strategy**:
```typescript
// SpaceManager will load from fastest layer first
const space = await spaceManager.loadSpace(pointer, [
  new IndexedDBPersistenceLayer(spaceId),      // Fast: loads first
  new FileSystemPersistenceLayer(spacePath, spaceId)  // Sync: merges operations
]);
```

**Operation Flow**:
1. **Space Construction**: Use first loaded layer (typically IndexedDB) to construct space
2. **Operation Merging**: Merge operations from file system layer using RepTree conflict resolution  
3. **Dual Saving**: All new operations saved to both layers in parallel
4. **File Watching**: File system changes merged into active space automatically

### 5. Integration Points

**SpaceManager Integration**:
```typescript
// Always use both persistence layers together
const spaceManager = new SpaceManager();
const space = await spaceManager.createSpace({
  persistenceLayers: [
    new IndexedDBPersistenceLayer(spaceId),
    new FileSystemPersistenceLayer('/path/to/space', spaceId)
  ]
});
```

**Cross-Device Workflow**:
- Device A: Saves to IndexedDB + file system  
- File system synced via Dropbox/iCloud/Git
- Device B: Loads from IndexedDB (if available) + file system operations merged

### 6. Key Design Decisions

**Reuse Existing Logic**:
- Keep proven directory structure and file organization
- Maintain operation parsing worker for performance
- Preserve encryption/decryption for secrets

**New Architecture Benefits**:
- Remove direct Space coupling
- Support multiple concurrent persistence layers
- Enable easier testing with mock persistence layers

**Platform Considerations**:
- Graceful degradation on web (no file watching)
- Tauri-specific optimizations for file operations

## Implementation Plan

1. **Phase 1**: Core persistence layer (one-way)
   - File operations (load/save)
   - Operation batching and JSONL format
   - Secrets encryption/decryption
   - Integration with IndexedDB layer in SpaceManager

2. **Phase 2**: Two-way sync (Tauri only)
   - File watching integration
   - Incoming operation handling and merging
   - Error handling and recovery
   - Platform detection for web graceful degradation

3. **Phase 3**: Testing and optimization
   - Dual persistence integration tests
   - Performance optimization for batch operations
   - Cross-device sync validation

## Open Questions

1. **Worker Integration**: How to handle web worker in new architecture?
2. **Error Handling**: Strategy for file system errors (permissions, disk full)?
3. **Concurrent Access**: Handle multiple app instances accessing same space?
4. **Performance**: Batch size and timing optimizations?
5. **Loading Priority**: Should SpaceManager wait for fastest layer or have timeout for slower layers? 