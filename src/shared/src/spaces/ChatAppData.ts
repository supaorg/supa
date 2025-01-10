import type { Vertex } from "../replicatedTree/Vertex";
import { ReplicatedTree } from "../replicatedTree/ReplicatedTree";
import type Space from "./Space";
import type { VertexPropertyType } from "../replicatedTree/treeTypes";
import type { ThreadMessage } from "../models";

export class ChatAppData {
  private root: Vertex;
  private referenceInSpace: Vertex;

  static createNewChatTree(space: Space, configId: string): ReplicatedTree {
    const tree = space.newAppTree("default-chat").tree;
    tree.setVertexProperty(tree.rootVertexId, "configId", configId);
    tree.newNamedVertex(tree.rootVertexId, "messages");
    return tree;
  }

  constructor(private space: Space, private appTree: ReplicatedTree) {
    this.root = appTree.getVertex(appTree.rootVertexId)!;
    this.referenceInSpace = space.getVertexReferencingAppTree(appTree.rootVertexId)!;
  }

  get messagesVertex(): Vertex | undefined {
    return this.appTree.getVertexByPath("messages");
  }

  get configId(): string | undefined {
    return this.root.getProperty("configId") as string;
  }

  set configId(configId: string) {
    this.root.setProperty("configId", configId);
  }

  get title(): string | undefined {
    return this.root.getProperty("title") as string;
  }

  set title(title: string) {
    console.log("setting title", title);
    this.root.setProperty("title", title);
    this.referenceInSpace.setProperty("title", title);
  }

  get messages(): ThreadMessage[] {
    const msgs: ThreadMessage[] = [];
    let targetVertex = this.messagesVertex;

    if (!targetVertex) {
      return [];
    }

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
    return this.appTree.observeVertexMove((vertex, isNew) => {
      if (isNew) {
        const text = vertex.getProperty("text");
        if (text) {
          callback(this.messages);
        }
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

  newMessage(role: "user" | "assistant" | "error", text: string): ThreadMessage {
    const lastMsgVertex = this.getLastMsgParentVertex();

    const newMessageVertex = this.appTree.newVertex(lastMsgVertex.id, {
      _n: "message",
      createdAt: Date.now(),
      text,
      role,
    });

    const props = newMessageVertex.getProperties();
    return {
      id: newMessageVertex.id,
      ...props,
    } as ThreadMessage;
  }

  private getLastMsgParentVertex(): Vertex {
    let targetVertex = this.messagesVertex;

    if (!targetVertex) {
      // Create messages vertex if it doesn't exist
      targetVertex = this.appTree.newVertex(this.appTree.rootVertexId, {
        _n: "messages",
      });
    }

    // Get the last message vertex
    while (targetVertex.children.length > 0) {
      targetVertex = targetVertex.children[0];
    }

    return targetVertex;
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

  isLastMessage(messageId: string): boolean {
    const vertex = this.appTree.getVertex(messageId);
    if (!vertex) {
      return false;
    }
    return vertex.children.length === 0;
  }

  isMessageInProgress(messageId: string): boolean {
    const vertex = this.appTree.getVertex(messageId);
    if (!vertex) {
      return false;
    }

    return vertex.getProperty("inProgress") === true;
  }
}
