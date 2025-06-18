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
  // For now, assume all non-http URIs are in-browser spaces
  // Load the existing space from database operations
  return await loadExistingInBrowserSpaceSync(pointer);
}