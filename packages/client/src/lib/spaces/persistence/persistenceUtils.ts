import type { PersistenceLayer } from "@supa/core";
import { IndexedDBPersistenceLayer } from "./IndexedDBPersistenceLayer";
import { FileSystemPersistenceLayer } from "@supa/core";
import { clientState } from "@supa/client/state/clientState.svelte";

/**
 * Determines which persistence layers are needed based on the space URI
 * @param spaceId The space ID
 * @param uri The space URI (local://, file path, http://, etc.)
 * @returns Array of persistence layers to use
 */
export function createPersistenceLayersForURI(spaceId: string, uri: string): PersistenceLayer[] {
  const layers: PersistenceLayer[] = [];

  if (uri.startsWith("local://")) {
    // Local-only spaces: IndexedDB only
    layers.push(new IndexedDBPersistenceLayer(spaceId));
  } else if (uri.startsWith("http://") || uri.startsWith("https://")) {
    // Server-synced spaces: IndexedDB + Server (future)
    layers.push(new IndexedDBPersistenceLayer(spaceId));
    // TODO: Add server persistence layer when implemented
    // layers.push(new ServerPersistenceLayer(spaceId, uri));
  } else {
    // File system path: IndexedDB + FileSystem (dual persistence)
    layers.push(new IndexedDBPersistenceLayer(spaceId));
    layers.push(new FileSystemPersistenceLayer(uri, spaceId, clientState.fs));
  }

  return layers;
}