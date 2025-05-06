import Dexie from 'dexie';

// Schema definitions
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

// Database class
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

// Helper methods
export async function getAllPointers(): Promise<SpacePointer[]> {
  try {
    return await db.pointers.toArray();
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
    await db.pointers.bulkPut(pointers);
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

// Initialize database
export async function initializeDatabase(): Promise<{
  pointers: SpacePointer[];
  currentSpaceId: string | null;
  config: Record<string, unknown>;
}> {
  try {
    const pointers = await getAllPointers();
    const currentSpaceId = await getCurrentSpaceId();
    const config = await getAllConfig();
    
    console.log('Successfully loaded database');
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
