# SpaceSetup Proposal

## Overview

This proposal outlines a new `SpaceSetup` structure that will store comprehensive space data while maintaining the existing `SpacePointer` type for space connections. The goal is to create a more general object that can be used by both the space management system and the ttabs layout system, allowing for better integration between these components.

## Current Implementation

Currently, the application uses `SpacePointer` to store basic information about spaces:

```typescript
export type SpacePointer = {
  id: string;
  uri: string;
  name: string | null;
  createdAt: Date;
}
```

This information is stored in the local database (Dexie) and used by the `spaceStore` to manage spaces. However, there's no built-in way to store additional space-related information like ttabs layout or theme preferences.

The `SupaTtabsLayout.svelte` component currently has commented-out code for loading and saving ttabs layouts, but it lacks a proper storage mechanism.

## Proposed Solution

We propose creating a new `SpaceSetup` type that contains all space-related data:

```typescript
export type SpaceSetup = {
  // Core identification fields
  id: string;
  uri: string;
  name: string | null;
  createdAt: Date;
  
  // Additional fields
  ttabsLayout: string | null; // Serialized ttabs layout
  theme: string | null; // Theme preference for this space
  ops?: string[]; // RepTree ops (stored but not loaded into spaceStore)
  // Other space-specific settings can be added here
}
```

The existing `SpacePointer` type will be kept as-is and will be constructed from `SpaceSetup` data when needed for connecting to spaces.

### Database Changes

The local database will store the complete `SpaceSetup` objects:

```typescript
class LocalDb extends Dexie {
  spaces!: Dexie.Table<SpaceSetup, string>;
  config!: Dexie.Table<ConfigEntry, string>;
  
  constructor() {
    super('localDb');
    this.version(1).stores({
      spaces: '&id, uri, name, createdAt',
      config: '&key',
    });
  }
}
```

Since we're still in WIP, we'll replace the existing implementation without worrying about migrations.

#### Selective Data Loading

To efficiently handle potentially large amounts of data (especially RepTree ops), we'll implement selective loading using Dexie's capabilities:

```typescript
// Get all space setups without loading ops
export async function getAllSpaceSetupsWithoutOps(): Promise<SpaceSetup[]> {
  try {
    return await db.spaces
      .toCollection()
      .select(['id', 'uri', 'name', 'createdAt', 'ttabsLayout', 'theme'])
      .toArray();
  } catch (error) {
    console.error('Failed to get space setups from database:', error);
    return [];
  }
}

// Get pointers only (minimal data needed for connections)
export async function getAllPointers(): Promise<SpacePointer[]> {
  try {
    return await db.spaces
      .toCollection()
      .select(['id', 'uri', 'name', 'createdAt'])
      .toArray();
  } catch (error) {
    console.error('Failed to get pointers from database:', error);
    return [];
  }
}

// Get ops for a specific space only when needed
export async function getSpaceOps(spaceId: string): Promise<string[] | undefined> {
  try {
    // Only select the ops field to minimize data transfer
    const result = await db.spaces
      .where('id')
      .equals(spaceId)
      .first();
    return result?.ops;
  } catch (error) {
    console.error(`Failed to get ops for space ${spaceId}:`, error);
    return undefined;
  }
}
```

This approach ensures that large collections of ops are only loaded into memory when explicitly needed, rather than being loaded with every space.

### Usage in spaceStore

The `spaceStore` would continue to store only `SpacePointer` objects, keeping its current implementation intact:

```typescript
class SpaceStore {
  pointers: SpacePointer[] = $state([]);
  currentSpaceId: string | null = $state(null);
  connections: SpaceConnection[] = $state([]);
  // ...other properties
  
  // Initialize the store with data from the database
  async initialize(): Promise<void> {
    // Note: we're only loading pointers, not the full SpaceSetup
    const pointers = await getAllPointers();
    this.pointers = pointers;
    // ... other initialization
  }
  
  // Current implementation remains the same
  get currentPointer(): SpacePointer | null {
    return this.pointers.find(p => p.id === this.currentSpaceId) || null;
  }
}
```

### Enhanced localDb Functions

Instead of creating a separate manager, we'll add these helper functions directly to the localDb.ts file:

```typescript
// Get the complete SpaceSetup for a space (without ops)
export async function getSpaceSetup(spaceId: string): Promise<SpaceSetup | undefined> {
  try {
    return await db.spaces
      .where('id')
      .equals(spaceId)
      .select(['id', 'uri', 'name', 'createdAt', 'ttabsLayout', 'theme'])
      .first();
  } catch (error) {
    console.error(`Failed to get setup for space ${spaceId}:`, error);
    return undefined;
  }
}

// Get just the ttabsLayout for a space
export async function getTtabsLayout(spaceId: string): Promise<string | null | undefined> {
  try {
    const result = await db.spaces
      .where('id')
      .equals(spaceId)
      .select(['ttabsLayout'])
      .first();
    return result?.ttabsLayout;
  } catch (error) {
    console.error(`Failed to get ttabsLayout for space ${spaceId}:`, error);
    return undefined;
  }
}

// Save ttabsLayout for a space
export async function saveTtabsLayout(spaceId: string, layout: string): Promise<void> {
  try {
    // Use update() to modify only the specific field without loading the entire object
    await db.spaces
      .where('id')
      .equals(spaceId)
      .modify({ ttabsLayout: layout });
  } catch (error) {
    console.error(`Failed to save ttabsLayout for space ${spaceId}:`, error);
  }
}

// Get ops for a space
export async function getSpaceOps(spaceId: string): Promise<string[] | undefined> {
  try {
    const result = await db.spaces
      .where('id')
      .equals(spaceId)
      .select(['ops'])
      .first();
    return result?.ops;
  } catch (error) {
    console.error(`Failed to get ops for space ${spaceId}:`, error);
    return undefined;
  }
}

// Save ops for a space
export async function saveSpaceOps(spaceId: string, ops: string[]): Promise<void> {
  try {
    // Use update() to modify only the specific field without loading the entire object
    await db.spaces
      .where('id')
      .equals(spaceId)
      .modify({ ops: ops });
  } catch (error) {
    console.error(`Failed to save ops for space ${spaceId}:`, error);
  }
}

// Create or update a complete SpaceSetup
export async function saveSpaceSetup(setup: SpaceSetup): Promise<void> {
  try {
    await db.spaces.put(setup);
  } catch (error) {
    console.error('Failed to save space setup:', error);
  }
}
```

### Usage in SupaTtabsLayout

The `SupaTtabsLayout` component would use the localDb functions directly to read and write ttabs layout data:

```typescript
import { getTtabsLayout, saveTtabsLayout } from "$lib/localDb";

async function loadLayout(spaceId: string): Promise<boolean> {
  // Get the ttabsLayout directly from the database
  const ttabsLayout = await getTtabsLayout(spaceId);

  if (ttabsLayout) {
    // Save the layout to compare later for changes
    lastSavedLayout = ttabsLayout;
    
    // Deserialize the layout
    return ttabs.deserializeLayout(ttabsLayout);
  }

  return false;
}

async function saveCurrentLayout(): Promise<void> {
  const spaceId = spaceStore.currentSpaceId;
  if (!spaceId) return;

  // Serialize the current layout
  const layoutJson = ttabs.serializeLayout();

  // Only save if the layout has changed
  if (layoutJson !== lastSavedLayout) {
    lastSavedLayout = layoutJson;
    
    // Save to database directly
    await saveTtabsLayout(spaceId, layoutJson);
  }
}
```

## Benefits

1. **Separation of Concerns**: `SpacePointer` remains focused on space connections while `SpaceSetup` handles all space data
2. **Data Storage Efficiency**: Store additional data like RepTree ops without loading them into memory in spaceStore
3. **Selective Loading**: Only load the specific data needed for each operation, keeping memory usage efficient
4. **Reduced Duplication**: No need to maintain separate storage mechanisms for ttabs layouts and other space settings
5. **Extensibility**: Easy to add more space-specific settings in the future
6. **Better Developer Experience**: Clearer code organization and responsibility boundaries
7. **Scalability**: Can handle spaces with thousands of ops without performance degradation

## Implementation Steps

1. Create the new `SpaceSetup` type
2. Update the database to store `SpaceSetup` objects instead of `SpacePointer` objects
3. Modify the `spaceStore` to work with `SpaceSetup` but provide `SpacePointer` data when needed
4. Update the `SupaTtabsLayout` component to read/write ttabs layout data
5. Update any other components that need access to the additional space data

## Considerations

- **Performance**: Monitor memory usage since we'll be storing more data per space
- **Data Consistency**: Ensure that changes to space data are properly synchronized between components
- **Testing**: Test the new functionality thoroughly, especially the conversion between `SpaceSetup` and `SpacePointer`

## Conclusion

The proposed `SpaceSetup` structure provides a more cohesive and extensible way to manage space-related data in the application while maintaining the simplicity of `SpacePointer` for space connections. By separating the concerns of data storage and space connection, we can improve code organization, reduce duplication, and enable better integration between different parts of the application.

This approach also allows us to store RepTree ops and other large data without keeping them in memory in the spaceStore, which should improve performance for applications with many spaces or large amounts of space-specific data.
