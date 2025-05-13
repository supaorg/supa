# Local Space Synchronization

This document explains how local space synchronization works in Supa, focusing on the implementation in `LocalSpaceSync.ts` and its integration with RepTree.

## Overview

Supa stores spaces in a directory structure where each tree is constructed with its own set of operations (ops). Each peer ID of a tree gets its own operations file that it appends to. This approach allows for synchronizing changes without overwrites and is powered by RepTree, a CRDT-based tree data structure.

## Key Components

### RepTree

RepTree is the foundation of Supa's space synchronization. It's a tree data structure using Conflict-free Replicated Data Types (CRDTs) for seamless replication between peers:

- A move tree CRDT is used for the tree structure (based on [Martin Kleppmann's paper](https://martin.kleppmann.com/papers/move-op.pdf))
- A last writer wins (LWW) CRDT is used for properties
- Yjs integration for collaborative editing with various shared data types (Text, Array, Map, XML)

### LocalSpaceSync

`LocalSpaceSync` is the class responsible for synchronizing a Space with its local file representation. It implements the `SpaceConnection` interface and provides methods to connect, disconnect, and check connection status.

## How It Works

### Directory Structure

Spaces are stored in a directory structure with the following organization:

```
/space-directory/
  space.json           # Contains space metadata (ID)
  secrets              # Encrypted space secrets
  ops/                 # Operations directory
    xx/                # First 2 chars of tree ID
      xxxxxxxxxx/      # Rest of tree ID
        YYYY-MM-DD/    # Date directory
          peerId.jsonl # Operations file for a specific peer
```

### Operation Storage

Operations are stored in JSONL (JSON Lines) format, where each line represents a single operation:

- Move operations: `["m",counter,"targetId","parentId"]`
- Property operations: `["p",counter,"targetId","key",value]`

### Synchronization Process

1. **Space Creation/Loading**:
   - When creating a new space, a unique ID is generated and saved in `space.json`
   - When loading a space, operations are read from all `.jsonl` files and applied to reconstruct the space

2. **Operation Handling**:
   - When operations are applied locally, they're added to a queue to be saved
   - Operations are saved to disk periodically (default: every 500ms)
   - Each peer's operations are saved to its own file, named with the peer's ID

3. **File Watching**:
   - `LocalSpaceSync` watches the space directory for changes
   - When new operation files are created or modified, they're read and the operations are applied to the local tree
   - This enables real-time synchronization between different instances accessing the same space directory

4. **Secret Management**:
   - Space secrets are encrypted using AES-GCM
   - Secrets are saved to a file named `secrets` in the space directory
   - Secrets are not using RepTree and instead are just files

### Tree Loading

When a space is loaded:

1. All operation files are read in chronological order (sorted by date directories); but don't have to be applied in that order (RepTree CRDTs can be applied in any order)
2. Operations are parsed and applied to reconstruct the tree structure
3. The space is initialized with the reconstructed tree
4. File watchers are set up to detect changes from other peers

## Benefits of This Approach

1. **Conflict-Free Synchronization**: Using CRDTs ensures that concurrent changes from different peers can be merged without conflicts.

2. **Offline Support**: Operations are stored locally, allowing work to continue without network connectivity.

3. **Append-Only Operations**: Each peer only appends to its own operations file, avoiding write conflicts.

4. **Scalability**: The directory structure (tree ID split into subdirectories) helps manage large spaces with many operations.

5. **History Preservation**: All operations are preserved, maintaining a complete history of changes.

## Implementation Details

- Operations are saved in batches to improve performance
- File watching is set up with the Tauri FS plugin
- Operations are parsed in a Web Worker to avoid blocking the main thread
- Date-based directories help organize operations chronologically
