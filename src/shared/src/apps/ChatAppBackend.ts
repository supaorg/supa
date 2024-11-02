import { isSetPropertyOp, type VertexOperation } from "../replicatedTree/operations";
import { TreeVertex } from "../replicatedTree/TreeVertex";
import type AppTree from "../spaces/AppTree";
import Space from "../spaces/Space";

export default class ChatAppBackend {
  constructor(private space: Space) {

  }

  addOp(appTree: AppTree, op: VertexOperation) {
    // Just check for a property op that sets "role" and reply to that message
    if (isSetPropertyOp(op) && op.key === "role" && op.value === "user") {
      const messageId = op.targetId;

      const message = appTree.tree.getVertex(messageId);
      if (!message) {
        throw new Error(`Message with id ${messageId} not found`);
      }

      this.replyToMessage(appTree, message);
    }
  }

  private replyToMessage(appTree: AppTree, message: TreeVertex) {
    
    const newMessageVertex = appTree.tree.newVertex(message.id);
    appTree.tree.setVertexProperty(newMessageVertex, "_n", "message");
    appTree.tree.setVertexProperty(newMessageVertex, "createdAt", Date.now());
    appTree.tree.setVertexProperty(newMessageVertex, "text", "Hello, user!");
    appTree.tree.setVertexProperty(newMessageVertex, "role", "assistant");
  }

}