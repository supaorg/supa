import type { Vertex } from "@shared/replicatedTree/Vertex";
import { ReplicatedTree } from "../replicatedTree/ReplicatedTree";
import type Space from "./Space";
import type { VertexPropertyType } from "@shared/replicatedTree/treeTypes";
import type { ThreadMessage } from "@shared/models";
import { isMoveVertexOp } from "@shared/replicatedTree/operations";

export class ChatAppData {
  private root: Vertex;
  private messagesVertex: Vertex;
  private referenceInSpace: Vertex;

  constructor(private space: Space, private appTree: ReplicatedTree) {
    this.root = appTree.getVertex(appTree.rootVertexId)!;
    this.messagesVertex = appTree.getVertexByPath("messages")!;
    this.referenceInSpace = space.getVertexReferencingAppTree(appTree.rootVertexId)!;
  }

  get configId(): string | undefined {
    return this.root.getProperty("configId")?.value as string;
  }

  get title(): string | undefined {
    return this.root.getProperty("title")?.value as string;
  }

  set title(title: string) {
    this.root.setProperty("title", title);
    this.referenceInSpace.setProperty("title", title);
  }

  get messages(): ThreadMessage[] {
    const msgs: ThreadMessage[] = [];
    let targetVertex: Vertex | undefined = this.messagesVertex;

    while (true) {
      const newMsgs = this.getChildMessages(targetVertex);
      if (newMsgs.length === 0) {
        break;
      }

      msgs.push(newMsgs[0]);
      targetVertex = targetVertex.children[0];
    }

    return msgs;
  }

  observe(callback: (data: Record<string, VertexPropertyType>) => void): () => void {
    callback(this.root.getProperties());

    return this.root.observe((_) => {
      callback(this.root.getProperties());
    });
  }

  observeMessages(callback: (messages: ThreadMessage[]) => void): () => void {
    callback(this.messages);

    return this.appTree.observeOpApplied((op) => {
      if (op && isMoveVertexOp(op)) {
        callback(this.messages);
      }
    });
  }

  observeMessage(id: string, callback: (message: ThreadMessage) => void): () => void {
    const vertex = this.appTree.getVertex(id);
    if (!vertex) {
      throw new Error(`Vertex ${id} not found`);
    }

    callback(vertex.getAsTypedObject<ThreadMessage>());

    return this.root.observe((event) => {
      if (event.type === "property") {
        callback(vertex.getAsTypedObject<ThreadMessage>());
      }
    });
  }

  newMessage(message: ThreadMessage): void {
    const lastMsgVertex = this.messages[this.messages.length - 1];

    const newMessageVertex = this.appTree.newVertex(lastMsgVertex.id);
    newMessageVertex.setProperties(message);
  }

  private getChildMessages(vertex: Vertex): ThreadMessage[] {
    const messages: ThreadMessage[] = [];

    for (const child of vertex.children) {
      messages.push({
        id: child.id,
        role: child.getProperty("role")?.value as "user" | "assistant",
        text: child.getProperty("text")?.value as string,
        createdAt: child.getProperty("createdAt")?.value as number,
        inProgress: child.getProperty("inProgress")?.value as number | null,
        updatedAt: child.getProperty("updatedAt")?.value as number | null,
      });
    }

    return messages;
  }

}
