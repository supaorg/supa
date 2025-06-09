import Space from "@core/spaces/Space";
import type { SpaceConnection } from "./SpaceConnection";
import uuid from "@core/uuid/uuid";
import { Backend } from "@core/spaces/Backend";

export class InBrowserSpaceSync implements SpaceConnection {
  private _space: Space;
  private _connected: boolean = false;
  private _backend: Backend;

  constructor(space: Space) {
    this._space = space;
  } 

  get space(): Space {
    return this._space;
  }

  get connected(): boolean {
    return this._connected;
  }

  async connect(): Promise<void> {
    this._backend = new Backend(this._space, true);

    this._connected = true;
  }

  async disconnect(): Promise<void> {
    this._connected = false;
  }
}

export function createNewInBrowserSpaceSync(): SpaceConnection {
  const space = Space.newSpace(uuid());
  const sync = new InBrowserSpaceSync(space);
  sync.connect();
  return sync;
}