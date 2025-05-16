import Dexie from 'dexie';
import type { SpacePointer } from './spaces/SpacePointer';
import type { VertexOperation } from 'reptree';

/**
 * Space setup on a client side
 * The setup points to a space either local or remote by url field
 */
export type SpaceSetup = {
  // Global unique identifier of the space
  id: string;
  // The url to the space: both local and remote; e.g file://path/to/space-dir or http://example.com/space-api
  uri: string;
  name: string | null;
  createdAt: Date;
  
  // Additional fields
  ttabsLayout?: string | null;
  theme?: string | null;
  ops?: VertexOperation[];
};

export interface ConfigEntry {
  key: string;
  value: unknown;
}

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

export const db = new LocalDb();

export async function getAllPointers(): Promise<SpacePointer[]> {
  try {
    // Get all spaces but only return the pointer fields
    const spaces = await db.spaces.toArray();
    return spaces.map(space => ({
      id: space.id,
      uri: space.uri,
      name: space.name,
      createdAt: space.createdAt
    }));
  } catch (error) {
    console.error('Failed to get pointers from database:', error);
    return [];
  }
}

export async function getCurrentSpaceId(): Promise<string | null> {
  try {
    const entry = await db.config.get('currentSpaceId');
    return entry ? entry.value as string : null;
  } catch (error) {
    console.error('Failed to get currentSpaceId from database:', error);
    return null;
  }
}

export async function getAllConfig(): Promise<Record<string, unknown>> {
  try {
    const entries = await db.config.toArray();
    return Object.fromEntries(entries.map(e => [e.key, e.value]));
  } catch (error) {
    console.error('Failed to get config from database:', error);
    return {};
  }
}

export async function savePointers(pointers: SpacePointer[]): Promise<void> {
  try {
    // Ensure all pointers have serializable createdAt dates
    const serializablePointers = pointers.map(pointer => {
      // Make a copy of the pointer to avoid modifying the original
      const serializedPointer = { ...pointer };
      
      // Ensure createdAt is a proper Date object
      // If it's already a Date, use it; otherwise try to create a new Date from it
      if (!(serializedPointer.createdAt instanceof Date)) {
        try {
          serializedPointer.createdAt = new Date(serializedPointer.createdAt);
        } catch (dateError) {
          console.error('Failed to convert createdAt to Date:', dateError);
          // Fallback to current date if conversion fails
          serializedPointer.createdAt = new Date();
        }
      }
      
      return serializedPointer;
    });
    
    // Convert pointers to SpaceSetup objects and save them
    // This preserves any existing additional data like ttabsLayout
    for (const pointer of serializablePointers) {
      try {
        // Check if this space already exists
        const existingSpace = await db.spaces.get(pointer.id);
        
        if (existingSpace) {
          // Update only the pointer fields, preserving other data
          await db.spaces.update(pointer.id, {
            uri: pointer.uri,
            name: pointer.name,
            createdAt: pointer.createdAt
          });
        } else {
          // Create a new space setup
          await db.spaces.put({
            ...pointer,
            ttabsLayout: null,
            theme: null
          });
        }
      } catch (spaceError) {
        console.error(`Failed to save space ${pointer.id}:`, spaceError);
      }
    }
  } catch (error) {
    console.error('Failed to save pointers to database:', error);
  }
}

export async function saveConfig(config: Record<string, unknown>): Promise<void> {
  try {
    await db.config.bulkPut(
      Object.entries(config).map(([key, value]) => ({ key, value }))
    );
  } catch (error) {
    console.error('Failed to save config to database:', error);
  }
}

export async function saveCurrentSpaceId(id: string | null): Promise<void> {
  if (id === null) return;
  
  try {
    await db.config.put({ key: 'currentSpaceId', value: id });
  } catch (error) {
    console.error('Failed to save currentSpaceId to database:', error);
  }
}

export async function initializeDatabase(): Promise<{
  pointers: SpacePointer[];
  currentSpaceId: string | null;
  config: Record<string, unknown>;
}> {
  try {
    const pointers = await getAllPointers();
    const currentSpaceId = await getCurrentSpaceId();
    const config = await getAllConfig();
    
    return { pointers, currentSpaceId, config };
  } catch (error) {
    console.error('Failed to initialize database:', error);
    
    // Attempt recovery
    try {
      await db.delete();
      await db.open();
      console.log('Database reset after error');
    } catch (recoveryError) {
      console.error('Failed to recover database:', recoveryError);
    }
    
    return { pointers: [], currentSpaceId: null, config: {} };
  }
}

// Get the complete SpaceSetup for a space (without ops)
export async function getSpaceSetup(spaceId: string): Promise<SpaceSetup | undefined> {
  try {
    const space = await db.spaces
      .where('id')
      .equals(spaceId)
      .first();
    
    if (space) {
      // Return everything except ops to avoid loading large data
      const { ops, ...spaceWithoutOps } = space;
      return spaceWithoutOps;
    }
    return undefined;
  } catch (error) {
    console.error(`Failed to get setup for space ${spaceId}:`, error);
    return undefined;
  }
}

// Get just the ttabsLayout for a space
export async function getTtabsLayout(spaceId: string): Promise<string | null | undefined> {
  try {
    const space = await db.spaces
      .where('id')
      .equals(spaceId)
      .first();
    return space?.ttabsLayout;
  } catch (error) {
    console.error(`Failed to get ttabsLayout for space ${spaceId}:`, error);
    return undefined;
  }
}

// Save ttabsLayout for a space
export async function saveTtabsLayout(spaceId: string, layout: string): Promise<void> {
  try {
    // Use modify to update only the specific field without loading the entire object
    await db.spaces
      .where('id')
      .equals(spaceId)
      .modify({ ttabsLayout: layout });
  } catch (error) {
    console.error(`Failed to save ttabsLayout for space ${spaceId}:`, error);
  }
}

// Get ops for a space
export async function getSpaceOps(spaceId: string): Promise<VertexOperation[] | undefined> {
  try {
    const space = await db.spaces
      .where('id')
      .equals(spaceId)
      .first();
    return space?.ops;
  } catch (error) {
    console.error(`Failed to get ops for space ${spaceId}:`, error);
    return undefined;
  }
}

// Save ops for a space
export async function saveSpaceOps(spaceId: string, ops: VertexOperation[]): Promise<void> {
  try {
    // Use modify to update only the specific field without loading the entire object
    await db.spaces
      .where('id')
      .equals(spaceId)
      .modify({ ops: ops });
  } catch (error) {
    console.error(`Failed to save ops for space ${spaceId}:`, error);
  }
}

// Save theme for a space
export async function saveSpaceTheme(spaceId: string, theme: string): Promise<void> {
  try {
    await db.spaces
      .where('id')
      .equals(spaceId)
      .modify({ theme: theme });
  } catch (error) {
    console.error(`Failed to save theme for space ${spaceId}:`, error);
  }
}

// Delete a space from the database
export async function deleteSpace(spaceId: string): Promise<void> {
  try {
    // Delete the space from the spaces table
    await db.spaces.delete(spaceId);
    
    // Check if this was the current space and clear it if so
    const currentId = await getCurrentSpaceId();
    if (currentId === spaceId) {
      await db.config.delete('currentSpaceId');
    }
    
    console.log(`Space ${spaceId} deleted from database`);
  } catch (error) {
    console.error(`Failed to delete space ${spaceId} from database:`, error);
  }
}
