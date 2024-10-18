import type { SpacePointer } from "./SpacePointer";
import Space from "@shared/spaces/Space";
import { ReplicatedTree } from "@shared/replicatedTree/ReplicatedTree";

export class TauriSpaceSync {
  private space: Space | null = null;

  constructor(private pointer: SpacePointer, private peerId: string) {
    const uri = pointer.uri;

    if (uri.startsWith("http")) {
      throw new Error("Remote spaces are not implemented yet");
    }
  }

  getSpace(): Space {
    if (!this.space) {
      throw new Error("Space not loaded. Call connect() first.");
    }

    return this.space;
  }

  async connect(): Promise<Space> {
    const ops = await this.loadSpaceTreeFromPath(this.pointer.uri);

    this.space = new Space(ops);

    return this.space;
  }

  private async loadSpaceTreeFromPath(path: string): Promise<ReplicatedTree> {

    // check if space.json at path + /v1/space.json exists
    // then go to /v1/ops/ and load all op files
    // subscribe to changes in that folder and load new ops
    // subscribe to changes in space tree and save ops in the folder

    //const path = uri.replace("file://", "");

    // @TODO: load ops from path
    return new ReplicatedTree(this.peerId);
  }
}