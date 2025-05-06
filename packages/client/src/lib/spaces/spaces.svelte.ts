import type Space from "@core/spaces/Space";
import { loadSpaceFromPointer, type SpaceConnection } from "./LocalSpaceSync";
import type { SpacePointer } from '../localDb';

class SpacesState {
  pointers: SpacePointer[] = $state([]);
  currentSpaceId: string | null = $state(null);
  connections: SpaceConnection[] = $state([]);
  config: Record<string, unknown> = $state({});

  currentSpace = $derived(this.connections.find(conn => conn.space.getId() === this.currentSpaceId)?.space || null);
  currentSpaceConnection = $derived(this.connections.find(conn => conn.space.getId() === this.currentSpaceId) || null);
  currentPointer = $derived(this.pointers.find(p => p.id === this.currentSpaceId) || null);

  /**
   * Initialize with data loaded from elsewhere
   * @param data The data to initialize the state with
   */
  setInitialState(data: {
    pointers: SpacePointer[],
    currentSpaceId: string | null,
    config: Record<string, unknown>
  }) {
    this.pointers = data.pointers;
    this.currentSpaceId = data.currentSpaceId;
    this.config = data.config;
  }

  /**
   * Create space connections from pointers and return the current one.
   * Use it only once on startup.
   * @returns The current space connection or null if none.
   */
  async loadSpacesAndConnectToCurrent(): Promise<SpaceConnection | null> {
    if (this.connections.length > 0) {
      // Find if any of the existing connections are connected
      const connectedConnection = this.connections.find(conn => conn.connected);
      if (connectedConnection) {
        console.error("Spaces already loaded. Can do it only once. Returning the connected one.");
        return connectedConnection;
      }
    }

    const connections: SpaceConnection[] = [];
    let currentConnection: SpaceConnection | null = null;

    // Try loading spaces from pointers
    for (const pointer of this.pointers) {
      try {
        const connection = await loadSpaceFromPointer(pointer);
        connections.push(connection);

        if (connection.space.getId() === this.currentSpaceId) {
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
      this.currentSpaceId = currentConnection.space.getId();
    }

    this.connections = connections;

    return currentConnection;
  }

  /**
   * Add a local space to the stores
   */
  addLocalSpace(connection: SpaceConnection, path: string): void {
    this.connections = [...this.connections, connection];

    const pointer: SpacePointer = {
      id: connection.space.getId(),
      uri: path,
      name: connection.space.name || null,
      createdAt: connection.space.createdAt,
    };

    this.pointers = [...this.pointers, pointer];
  }

  /**
   * Get a loaded space from a pointer
   */
  getLoadedSpaceFromPointer(pointer: SpacePointer): Space | null {
    const connection = this.connections.find((conn) => conn.space.getId() === pointer.id);
    return connection ? connection.space : null;
  }

  /**
   * Remove a space
   */
  async removeSpace(pointerId: string): Promise<void> {
    // Get the connection so we can disconnect it
    const connection = this.connections.find(conn => conn.space.getId() === pointerId);

    // Disconnect the space first if it exists and is connected
    if (connection && connection.connected) {
      await connection.disconnect();
    }

    // Remove from pointers
    this.pointers = this.pointers.filter(p => p.id !== pointerId);

    // Remove from loaded space connections
    this.connections = this.connections.filter(conn => conn.space.getId() !== pointerId);

    // If this was the current space, try to select another one
    if (this.currentSpaceId === pointerId) {
      const nextPointer = this.pointers[0];
      this.currentSpaceId = nextPointer?.id || null;
    }
  }

  /**
   * Disconnects all active space connections.
   * Call this when the application is closing/unmounting.
   */
  async disconnectAllSpaces(): Promise<void> {
    const disconnectPromises: Promise<void>[] = [];

    for (const connection of this.connections) {
      if (connection.connected) {
        disconnectPromises.push(connection.disconnect());
      }
    }

    await Promise.all(disconnectPromises);
  }

  /**
   * Get a space connection by space ID.
   */
  getSpaceConnectionById(spaceId: string): SpaceConnection | null {
    return this.connections.find(conn => conn.space.getId() === spaceId) || null;
  }
}

export const spaceStore = new SpacesState();