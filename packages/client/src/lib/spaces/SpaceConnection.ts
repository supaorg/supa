import type Space from "@core/spaces/Space";
import type { SpacePointer } from "./SpacePointer";
import { loadExistingInBrowserSpaceSync } from "./InBrowserSpaceSync";

export interface SpaceConnection {
  get space(): Space;
  get connected(): boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export async function loadSpaceFromPointer(pointer: SpacePointer): Promise<SpaceConnection> {
  if (pointer.uri.startsWith("http")) {
    throw new Error("Remote spaces are not supported by local space sync. Use a different connection method.");
  }

  // For now, assume all non-http URIs are in-browser spaces
  // Load the existing space from database operations
  return await loadExistingInBrowserSpaceSync(pointer.id);
}