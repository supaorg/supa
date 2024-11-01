import type { VertexOperation } from "@shared/replicatedTree/operations";
import type AppTree from "@shared/spaces/AppTree";
import Space from "@shared/spaces/Space";

export default class ChatAppBackend {
  constructor(private space: Space) {

  }

  addOp(appTree: AppTree, op: VertexOperation) {
    console.log("ChatAppBackend addOp", appTree.getAppId(), op);
  }

}