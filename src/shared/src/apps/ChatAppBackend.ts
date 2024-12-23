import { AppConfig } from "../models";
import { isSetPropertyOp, type VertexOperation } from "../replicatedTree/operations";
import type AppTree from "../spaces/AppTree";
import Space from "../spaces/Space";
import { AgentServices } from "../agents/AgentServices.ts";
import { SimpleChatAgent } from "../agents/SimpleChatAgent.ts";
import { ThreadTitleAgent } from "../agents/ThreadTitleAgent.ts";
import { Vertex } from "../replicatedTree/Vertex.ts";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
}

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

      // Get messages
      const messages = this.getMessagesUp(appTree, message);

      this.replyToMessage(appTree, messages);
    }
  }

  private getMessage(msgVertex: Vertex): ChatMessage {
    return {
      id: msgVertex.id,
      role: msgVertex.getProperty("role")?.value as "user" | "assistant",
      text: msgVertex.getProperty("text")?.value as string,
    };
  }

  private getMessagesUp(tree: AppTree, msgVertex: Vertex): ChatMessage[] {
    const messages: ChatMessage[] = [];
    messages.push(this.getMessage(msgVertex));

    let currentVertex = msgVertex.parent;
    while (currentVertex) {
      if (currentVertex.getProperty("_n")?.value !== "message") {
        break;
      }

      messages.push(this.getMessage(currentVertex));
      currentVertex = currentVertex.parent;
    }

    return messages.reverse();
  }

  private async replyToMessage(appTree: AppTree, messages: ChatMessage[]) {
    const configId = appTree.tree.getVertexProperty(appTree.tree.rootVertexId, "configId");
    const config: AppConfig | undefined = configId ? this.space.getAppConfig(configId.value as string) : undefined;

    if (!config) {
      throw new Error("No config found");
    }

    const agentServices = new AgentServices(this.space);
    const simpleChatAgent = new SimpleChatAgent(agentServices, config);
    const threadTitleAgent = new ThreadTitleAgent(agentServices, config);

    const lastMessage = messages[messages.length - 1];
    const newMessageVertex = appTree.tree.newVertex(lastMessage.id, {
      "_n": "message",
      "createdAt": Date.now(),
      "text": "thinking...",
      "role": "assistant"
    });

    const messagesForLang = [
      { role: "system", text: config.instructions },
      ...messages.map((m) => ({
        role: m.role,
        text: m.text,
      }))];

    const response = await simpleChatAgent.input(messagesForLang, (resp) => {
      const wipResponse = resp as string;
      appTree.tree.setTransientVertexProperty(newMessageVertex.id, "text", wipResponse);
      console.log(wipResponse);
    }) as string;

    // And finally set the permanent property
    newMessageVertex.setProperty("text", response);

    const newMessage = {
      id: newMessageVertex.id,
      role: "assistant",
      text: response,
    } as ChatMessage;
    messages.push(newMessage);

    const title = appTree.tree.getVertexProperty(appTree.tree.rootVertexId, "title")?.value as string;
    const newTitle = await threadTitleAgent.input({ messages, title }) as string;

    if (newTitle !== title) {
      appTree.tree.setVertexProperty(appTree.tree.rootVertexId, "title", newTitle as string);
    }

    const vertexIdReferencingAppTree = this.space.getVertexIdReferencingAppTree(appTree.getId());
    if (vertexIdReferencingAppTree) {
      const titleInSpace = this.space.tree.getVertexProperty(vertexIdReferencingAppTree, "_n")?.value as string;
      if (titleInSpace !== newTitle) {
        this.space.tree.setVertexProperty(vertexIdReferencingAppTree, "_n", newTitle);
      }
    }
  }
}