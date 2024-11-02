import type { VertexOperation } from "../replicatedTree/operations";
import Space from "./Space";
import ChatAppBackend from "../apps/ChatAppBackend";

/**
 * Monitors all incoming ops and sends them to back-ends specific to app trees.
 * And also checks if there are jobs available to be taken
 */
export class Backend {
  private chatAppBackend: ChatAppBackend;

  constructor(private space: Space, private inLocalMode: boolean = false) {
    if (!inLocalMode) {
      throw new Error("Backend is not supported for remote spaces yet");
    }

    this.chatAppBackend = new ChatAppBackend(space);
  }

  addOp(treeId: string, op: VertexOperation) {
    if (!this.inLocalMode) {
      // @TODO: add the op to the space
    }

    if (treeId === this.space.getId()) {
      return;
    }

    const appTree = this.space.getAppTree(treeId);

    if (!appTree) {
      throw new Error(`App tree with id ${treeId} not found`);
    }

    // name it 'default-chat-assist', 'chat-assistant', 'ai-chat'?
    if (appTree.getAppId() === "default-chat") {
      this.chatAppBackend.addOp(appTree, op);
    }
  }
}
