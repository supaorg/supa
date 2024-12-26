import type { Vertex } from "@shared/replicatedTree/Vertex";
import { ReplicatedTree } from "../replicatedTree/ReplicatedTree";
import type Space from "./Space";
import type { VertexPropertyType } from "@shared/replicatedTree/treeTypes";
import type { ThreadMessage } from "@shared/models";
import { isMoveVertexOp, isSetPropertyOp } from "@shared/replicatedTree/operations";

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
    return this.observeNewMessages(callback);
  }

  observeNewMessages(callback: (messages: ThreadMessage[]) => void): () => void {
    return this.appTree.observeVertexMove((vertex) => {
      if (vertex.getProperty("text")) {
        callback(this.messages);
      }
    });
  }

  observeMessage(id: string, callback: (message: ThreadMessage) => void): () => void {
    const vertex = this.appTree.getVertex(id);
    if (!vertex) {
      throw new Error(`Vertex ${id} not found`);
    }

    return this.appTree.observeVertex(id, (vertex) => {
      callback(vertex.getAsTypedObject<ThreadMessage>());
    });
  }

  newMessage(message: Partial<ThreadMessage>): ThreadMessage {
    const lastMsgVertex = this.messages[this.messages.length - 1];

    const newMessageVertex = this.appTree.newVertex(lastMsgVertex.id);
    newMessageVertex.setProperties(message);
    
    const props = newMessageVertex.getProperties();
    return {
      id: newMessageVertex.id,
      ...props,
    } as ThreadMessage;
  }

  private getChildMessages(vertex: Vertex): ThreadMessage[] {
    const messages: ThreadMessage[] = [];

    for (const child of vertex.children) {
      const props = child.getProperties();

      messages.push({
        id: child.id,
        role: props.role as "user" | "assistant",
        text: props.text as string,
        createdAt: props.createdAt as number,
        inProgress: props.inProgress as number | null,
        updatedAt: props.updatedAt as number | null
      });
    }

    return messages;
  }
}
