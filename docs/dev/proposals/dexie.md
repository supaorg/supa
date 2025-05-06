# Proposal: Dexie.js & Svelte Runes for Persistent Storage

## Background
- Current implementation (`spaceStore.ts`) uses `svelte-persisted-store` for pointers and config.
- Persistence is limited to simple key/value entries; lacks schema for spaces with full metadata.

## Goals
- Provide offline-capable, persistent storage for spaces and app config.
- Maintain full reactivity in Svelte UI via runes.
- Define a clear, typed schema for all stored entities.

## Current Space Flows
- **Pointer Persistence**: `spacePointersStore` (via `svelte-persisted-store`) holds minimal pointers (`id`, `uri`, `name`, `createdAt`, `lastPageUrl`).
- **Current Space ID**: `currentSpaceIdStore` stores the active space ID.
- **In-memory Connections**: `spaceStore` loads `SpaceConnection[]` on startup.
- **Loading on Launch**: `loadSpacesAndConnectToCurrent()` iterates pointers, calls `loadSpaceFromPointer()`, populates `spaceStore`, sets `currentSpaceIdStore`, and returns the current connection.
- **Creating a Space**: `addLocalSpace(connection, path)` appends to `spaceStore` and `spacePointersStore`.
- **Removing a Space**: `removeSpace(id)` disconnects the space, removes entries from both stores, and resets `currentSpaceIdStore` if needed.

## Proposed Design

### 1. Dexie.js Setup
- Create `LocalDb` class in `packages/client/src/lib/localDb.svelte.ts` extending Dexie.
- Define tables:
  - **pointers**: `&id, uri, name, createdAt, lastPageUrl`
  - **config**: `&key`

### 2. Schema Definitions
```ts
export interface SpacePointer {
  id: string;
  uri: string;
  name: string | null;
  createdAt: Date;
  lastPageUrl?: string;
}
export interface ConfigEntry {
  key: string;
  value: unknown;
}
```

### 3. Svelte Runes Integration
- Filename must be `localDb.svelte.ts` so runes apply.
- Define reactive state:
```ts
export const pointers = $state<SpacePointer[]>([]);
export const currentSpaceId = $state<string | null>(null);
export const config = $state<Record<string, unknown>>({});
```
- Derived signal for current pointer:
```ts
export const currentPointer = $derived(
  () => pointers.find(p => p.id === currentSpaceId)
);
```

### 4. Implementation Sketch (`localDb.svelte.ts`)
```ts
class LocalDb extends Dexie {
  pointers!: Dexie.Table<SpacePointer, string>;
  config!: Dexie.Table<ConfigEntry, string>;
  constructor() {
    super('localDb');
    this.version(1).stores({
      pointers: '&id, uri, name, createdAt, lastPageUrl',
      config: '&key',
    });
  }
}
export const db = new LocalDb();

// initial load with error handling
(async () => {
  try {
    pointers = await db.pointers.toArray();
    const currentSpaceIdEntry = await db.config.get('currentSpaceId');
    currentSpaceId = currentSpaceIdEntry ? currentSpaceIdEntry.value as string : null;
    
    const entries = await db.config.toArray();
    config = Object.fromEntries(entries.map(e => [e.key, e.value]));
    
    console.log('Successfully loaded database');
  } catch (error) {
    console.error('Failed to load database:', error);
    // Initialize with empty state
    pointers = [];
    currentSpaceId = null;
    config = {};
    
    // Optional: attempt recovery
    try {
      await db.delete();
      await db.open();
      console.log('Database reset after error');
    } catch (recoveryError) {
      console.error('Failed to recover database:', recoveryError);
    }
  }
})();

// sync pointers and currentSpaceId to Dexie with error handling
$effect(() => {
  try {
    db.pointers.bulkPut(pointers);
  } catch (error) {
    console.error('Failed to sync pointers to database:', error);
  }
});

$effect(() => {
  try {
    db.config.bulkPut(
      Object.entries(config).map(([key, value]) => ({ key, value }))
    );
  } catch (error) {
    console.error('Failed to sync config to database:', error);
  }
});

$effect(() => {
  if (currentSpaceId !== null) {
    try {
      db.config.put({ key: 'currentSpaceId', value: currentSpaceId });
    } catch (error) {
      console.error('Failed to sync currentSpaceId to database:', error);
    }
  }
});
```

- **Update flow**: any mutation to `pointers`, `currentSpaceId`, or `config` triggers a Dexie write via `$effect`. No manual CRUD wrappers are strictly necessary.

## IndexedDB Limitations

While the operations we'll be storing are lightweight, it's important to be aware of the following IndexedDB limitations:

1. **Storage Limits**:
   - Chrome/Chromium-based browsers: ~80% of available disk space per origin
   - Firefox: ~2GB per origin
   - Safari: ~1GB per origin, sometimes less on iOS
   - Mobile browsers generally have stricter limits

2. **Browser Support Edge Cases**:
   - Private browsing modes often have restricted or ephemeral storage
   - Some mobile browsers may clear storage under memory pressure
   - Safari has historically had more IndexedDB issues than other browsers

These limitations should not be problematic for our use case with lightweight operations, unless we accumulate an extremely large number of operations over time.

## Refactor Plan: spaceStore.ts → spaces.svelte.ts
1. Rename `packages/client/src/lib/spaces/spaceStore.ts` to `spaces.svelte.ts` (in same directory) to enable Svelte Runes compilation.
2. Remove imports from `svelte/store` and `svelte-persisted-store`; import `{ $state, $effect, $derived }` from `'svelte/runes'` and Dexie.
3. Replace `spacePointersStore`, `currentSpaceIdStore`, `spaceStore`, etc. with runes signals:
   ```ts
   export const pointers = $state<SpacePointer[]>([]);
   export const currentSpaceId = $state<string|null>(null);
   export const spaceStore = $state<SpaceConnection[]>([]);
   ```
4. On module load (in IIFE):
   - Load `pointers` and `currentSpaceId` from Dexie into runes signals.
   - Call existing `loadSpacesAndConnectToCurrent()` to set `spaceStore` and update `currentSpaceId`.
5. Add `$effect` blocks to auto-backup `pointers` and `currentSpaceId` to Dexie on every change.
6. Retain existing helpers (`loadSpacesAndConnectToCurrent`, `addLocalSpace`, `removeSpace`, `disconnectAllSpaces`), converting their store updates to direct runes mutations.
7. Remove outdated `setLastPageUrlInSpace` function.
8. Update all consumer components (`Spaces.svelte`, popups, etc.) to import and use the new runes signals (`pointers`, `currentSpaceId`, `spaceStore`, plus derived `currentSpace`/`currentSpaceConnection`).
9. Thoroughly test to ensure behavior matches the pre-refactor store logic.

## Migration Plan
1. Create `localDb.svelte.ts` with Dexie schema and runes-based state.
2. Replace `persisted`/`writable` stores in `spaceStore.ts` to use `LocalDb`.
3. On launch, load spaces and config from Dexie into Svelte state.
4. Update components to consume new stores and CRUD helpers.

## Next Steps
- Validate reactivity in existing UI (`Spaces.svelte`, popups, etc.).