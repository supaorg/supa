import type Space from "@core/spaces/Space";
import type { SpacePointer } from "./SpacePointer";
import { loadExistingInBrowserSpaceSync } from "./InBrowserSpaceSync";
import { loadExistingLocalSpace, isLocalSpaceUri } from "./spaceManagerSetup";

export interface SpaceConnection {
  get space(): Space;
  get connected(): boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export async function loadSpaceFromPointer(pointer: SpacePointer): Promise<SpaceConnection> {
  // Check if this is a local space (browser://)
  if (isLocalSpaceUri(pointer.uri)) {
    // Use new SpaceManager approach for local spaces
    return await loadExistingLocalSpace(pointer);
  }
  
  // For non-local spaces, use the existing approach
  return await loadExistingInBrowserSpaceSync(pointer);
}