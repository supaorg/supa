import { AppConfig } from "../models";
import { isSetPropertyOp, type VertexOperation } from "../replicatedTree/operations";
import { TreeVertex } from "../replicatedTree/TreeVertex";
import type AppTree from "../spaces/AppTree";
import Space from "../spaces/Space";
import { Lang } from 'aiwrapper';
import { AgentServices } from "../agents/AgentServices.ts";
import { SimpleChatAgent } from "../agents/SimpleChatAgent.ts";
import { ThreadTitleAgent } from "../agents/ThreadTitleAgent.ts";

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

  private getMessage(msgVertex: TreeVertex) {
    return {
      id: msgVertex.id,
      role: msgVertex.getProperty("role")?.value as "user" | "assistant",
      text: msgVertex.getProperty("text")?.value as string,
    };
  }

  private getMessagesUp(tree: AppTree, msgVertex: TreeVertex) {
    const messages: ChatMessage[] = [];
    messages.push(this.getMessage(msgVertex));

    let parentId = msgVertex.parentId;
    while (parentId) {
      const message = tree.tree.getVertex(parentId);

      if (!message) {
        throw new Error(`Message with id ${parentId} not found`);
      }

      if (message.getProperty("_n")?.value !== "message") {
        break;
      }

      messages.push(this.getMessage(message));
      parentId = message.parentId;
    }

    return messages.reverse();
  }

  private async replyToMessage(appTree: AppTree, messages: ChatMessage[]) {
    const configId = appTree.tree.getVertexProperty(appTree.tree.rootVertexId, "configId");
    const config: AppConfig = configId ? this.space.getAppConfig(configId.value as string) : Space.getDefaultAppConfig();
    const agentServices = new AgentServices(this.space);
    const simpleChatAgent = new SimpleChatAgent(agentServices, config);
    const threadTitleAgent = new ThreadTitleAgent(agentServices, config);

    const lastMessage = messages[messages.length - 1];
    const newMessageVertex = appTree.tree.newVertex(lastMessage.id);
    appTree.tree.setVertexProperty(newMessageVertex, "_n", "message");
    appTree.tree.setVertexProperty(newMessageVertex, "createdAt", Date.now());
    appTree.tree.setVertexProperty(newMessageVertex, "text", "thinking...");
    appTree.tree.setVertexProperty(newMessageVertex, "role", "assistant");

    const messagesForLang = [
      { role: "system", text: config.instructions },
      ...messages.map((m) => ({
        role: m.role,
        text: m.text,
      }))];

    const response = await simpleChatAgent.input(messagesForLang, (resp) => {
      const wipResponse = resp as string;
      appTree.tree.setTransientVertexProperty(newMessageVertex, "text", wipResponse);
      console.log(wipResponse);
    }) as string;

    // And finally set the permanent property
    appTree.tree.setVertexProperty(newMessageVertex, "text", response);

    const newMessage = {
      id: newMessageVertex,
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