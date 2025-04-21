import type { Readable, Writable } from "svelte/store";
import { writable, get, derived } from "svelte/store";
import { persisted, type Persisted } from 'svelte-persisted-store';
import type { SpacePointer } from "./SpacePointer";
import type Space from "@core/spaces/Space";
import { loadSpaceFromPointer, type SpaceConnection } from "./LocalSpaceSync";

/**
 * A persistent store of pointers to spaces.
 * We use pointers to connect to spaces.
 */
export const spacePointersStore: Persisted<SpacePointer[]> = persisted(
  "spacePointers",
  [],
);

/**
 * The current space id. It's used in pair with spacesStore.
 */
export const currentSpaceIdStore: Persisted<string | null> = persisted(
  "currentSpaceId",
  null,
);

/**
 * A store of space connections constructed from space pointers.
 */
export const spaceStore: Writable<SpaceConnection[]> = writable<SpaceConnection[]>([]);

/**
 * A derived store of the current space.
 * It's used to get the current space from the spacesStore.
 * @returns The current space or null.
 */
export const currentSpaceStore: Readable<Space | null> = derived(
  [currentSpaceIdStore, spaceStore],
  ([$currentSpaceId, $connections]) => {
    const connection = $connections.find(conn => conn.space.getId() === $currentSpaceId);
    return connection ? connection.space : null;
  }
);

/**
 * A derived store of the current space connection.
 */
export const currentSpaceConnectionStore: Readable<SpaceConnection | null> = derived(
  [currentSpaceIdStore, spaceStore],
  ([$currentSpaceId, $connections]) => {
    return $connections.find(conn => conn.space.getId() === $currentSpaceId) || null;
  }
);

/**
 * A shortcut to get the current space id.
 * @returns The current space id or null.
 */
export function getCurrentSpaceId(): string | null {
  return get(currentSpaceIdStore);
}

/**
 * Create space connections from pointers and return the current one.
 * Use it only once on startup.
 * @returns The current space connection or null if none.
 */
export async function loadSpacesAndConnectToCurrent(): Promise<SpaceConnection | null> {
  const existingConnections = get(spaceStore);
  if (existingConnections.length > 0) {
    // Find if any of the existing connections are connected
    const connectedConnection = existingConnections.find(conn => conn.connected);
    if (connectedConnection) {
      console.error("Spaces already loaded. Can do it only once. Returning the connected one.");
      return connectedConnection;
    }
  }

  const connections: SpaceConnection[] = [];
  let currentConnection: SpaceConnection | null = null;

  // Try loading spaces from pointers
  for (const pointer of get(spacePointersStore)) {
    try {
      const connection = await loadSpaceFromPointer(pointer);
      connections.push(connection);

      if (connection.space.getId() === get(currentSpaceIdStore)) {
        currentConnection = connection;
      }
    } catch (error) {
      console.error("Could not load space", pointer, error);
    }
  }

  // If we couldn't connect to the current space in the previous loop, 
  // use the first one as the current space.
  if (!currentConnection && connections.length > 0) {
    currentConnection = connections[0];
    currentSpaceIdStore.set(currentConnection.space.getId());
  }

  spaceStore.set(connections);

  return currentConnection;
}

export function setLastPageUrlInSpace(url: string) {
  const currentSpace = get(currentSpaceStore);

  if (!currentSpace) {
    return;
  }

  // Get the pointer corresponding to the current space
  const pointer = get(spacePointersStore).find((pointer) => pointer.id === currentSpace?.getId());
  if (pointer) {
    pointer.lastPageUrl = url;
    // Update the pointer in the store
    spacePointersStore.set(get(spacePointersStore));
  }
}

export function getCurrentSpacePointer(): SpacePointer | null {
  return get(spacePointersStore).find((pointer) => pointer.id === get(currentSpaceIdStore)) || null;
}

export function addLocalSpace(connection: SpaceConnection, path: string) {
  spaceStore.update((connections) => {
    return [...connections, connection];
  });

  const pointer: SpacePointer = {
    id: connection.space.getId(),
    uri: path,
    name: connection.space.name || null,
    createdAt: connection.space.createdAt,
  }

  spacePointersStore.update((pointers) => {
    return [...pointers, pointer];
  });
}

export function getLoadedSpaceFromPointer(pointer: SpacePointer): Space | null {
  const connection = get(spaceStore).find((conn) => conn.space.getId() === pointer.id);
  return connection ? connection.space : null;
}

export async function removeSpace(pointerId: string) {
  // Get the connection so we can disconnect it
  const connection = get(spaceStore).find(conn => conn.space.getId() === pointerId);
  
  // Disconnect the space first if it exists and is connected
  if (connection && connection.connected) {
    await connection.disconnect();
  }

  // Remove from pointers
  const pointers = get(spacePointersStore);
  const updatedPointers = pointers.filter(p => p.id !== pointerId);
  spacePointersStore.set(updatedPointers);

  // Remove from loaded space connections
  spaceStore.update(connections => 
    connections.filter(conn => conn.space.getId() !== pointerId)
  );

  // If this was the current space, try to select another one
  if (get(currentSpaceIdStore) === pointerId) {
    const nextPointer = updatedPointers[0];
    currentSpaceIdStore.set(nextPointer?.id || null);
  }
}

/**
 * Disconnects all active space connections.
 * Call this when the application is closing/unmounting.
 */
export async function disconnectAllSpaces(): Promise<void> {
  const connections = get(spaceStore);
  const disconnectPromises: Promise<void>[] = [];
  
  for (const connection of connections) {
    if (connection.connected) {
      disconnectPromises.push(connection.disconnect());
    }
  }
  
  await Promise.all(disconnectPromises);
}

/**
 * Get the current space connection.
 */
export function getCurrentSpaceConnection(): SpaceConnection | null {
  return get(currentSpaceConnectionStore);
}

/**
 * Get a space connection by space ID.
 */
export function getSpaceConnectionById(spaceId: string): SpaceConnection | null {
  return get(spaceStore).find(conn => conn.space.getId() === spaceId) || null;
}