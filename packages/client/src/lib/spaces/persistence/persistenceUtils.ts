import type { PersistenceLayer } from "@core/spaces/persistence/PersistenceLayer";
import { IndexedDBPersistenceLayer } from "./IndexedDBPersistenceLayer";
import { FileSystemPersistenceLayer } from "./FileSystemPersistenceLayer";

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
    layers.push(new FileSystemPersistenceLayer(uri, spaceId));
  }

  return layers;
}

/**
 * Checks if a URI represents a file system path (not local:// or http(s)://)
 */
export function isFileSystemURI(uri: string): boolean {
  return !uri.startsWith("local://") && 
         !uri.startsWith("http://") && 
         !uri.startsWith("https://");
}

/**
 * Checks if a URI requires dual persistence (IndexedDB + something else)
 */
export function requiresDualPersistence(uri: string): boolean {
  return isFileSystemURI(uri); // For now, only file system URIs need dual persistence
}

/**
 * Gets the file system path from a URI, or null if not a file system URI
 */
export function getFileSystemPath(uri: string): string | null {
  if (isFileSystemURI(uri)) {
    return uri;
  }
  return null;
}

/**
 * Sets the peer ID on file system persistence layers
 * This is needed so the FileSystemPersistenceLayer knows which operations to save
 */
export function setPeerIdOnLayers(layers: PersistenceLayer[], peerId: string): void {
  for (const layer of layers) {
    if (layer instanceof FileSystemPersistenceLayer) {
      layer.setPeerId(peerId);
    }
  }
} 