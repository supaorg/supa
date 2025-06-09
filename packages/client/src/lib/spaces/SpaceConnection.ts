import type Space from "@core/spaces/Space";
import type { SpacePointer } from "./SpacePointer";

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

  throw new Error("Not implemented");

  /*
  const space = await loadLocalSpace(pointer.uri);
  if (space.getId() !== pointer.id) {
    throw new Error("Space ID mismatch. Expected " + pointer.id + " but got " + space.getId());
  }

  const sync = new LocalSpaceSync(space, pointer.uri);
  await sync.connect();
  return sync;
  */
}