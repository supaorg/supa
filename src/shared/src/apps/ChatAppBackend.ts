import { type AppConfig, type ThreadMessage } from "../models";
import Space from "../spaces/Space";
import { AgentServices } from "../agents/AgentServices.ts";
import { SimpleChatAgent } from "../agents/SimpleChatAgent.ts";
import { ThreadTitleAgent } from "../agents/ThreadTitleAgent.ts";
import { ChatAppData } from "../spaces/ChatAppData";
import type { ReplicatedTree } from "../replicatedTree/ReplicatedTree";
import AppTree from "../spaces/AppTree.ts";

export default class ChatAppBackend {
  private data: ChatAppData;

  get appTreeId(): string {
    return this.appTree.tree.rootVertexId;
  }

  constructor(private space: Space, private appTree: AppTree) {
    this.data = new ChatAppData(this.space, appTree);

    this.processMessages(this.data.messages);

    this.data.observeNewMessages((messages) => {
      this.processMessages(messages);
    });

    this.appTree.onEvent('retry-message', (event) => {
      const messageId = event.messageId;

      if (!messageId) {
        return;
      }

      console.log("Try replying to a message again", messageId);
    });
  }

  private processMessages(messages: ThreadMessage[]) {
    if (messages.length === 0) {
      return;
    }

    if (messages[messages.length - 1].role === "user") {
      this.replyToMessage(messages);
    }
  }

  private async replyToMessage(messages: ThreadMessage[]) {
    const config: AppConfig | undefined = this.data.configId ?
      this.space.getAppConfig(this.data.configId) : undefined;

    if (!config) {
      throw new Error("No config found");
    }

    const agentServices = new AgentServices(this.space);
    const simpleChatAgent = new SimpleChatAgent(agentServices, config);
    const threadTitleAgent = new ThreadTitleAgent(agentServices, config);

    const newMessage = this.data.newMessage("assistant", "thinking...");
    this.appTree.tree.setVertexProperty(newMessage.id, "inProgress", true);

    try {
      const messagesForLang = [
        { role: "system", text: config.instructions },
        ...messages.map((m) => ({
          role: m.role,
          text: m.text,
        }))];

      const response = await simpleChatAgent.input(messagesForLang, (resp) => {
        const wipResponse = resp as string;
        this.appTree.tree.setTransientVertexProperty(newMessage.id, "text", wipResponse);
      }) as string;

      // Update the message with the final response
      this.appTree.tree.setVertexProperty(newMessage.id, "text", response);
      this.appTree.tree.setVertexProperty(newMessage.id, "inProgress", false);

      messages.push({ ...newMessage, text: response });

      const newTitle = await threadTitleAgent.input({
        messages,
        title: this.data.title
      }) as string;

      if (newTitle !== this.data.title) {
        this.data.title = newTitle;
      }

      this.space.setAppTreeName(this.appTreeId, this.data.title);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      this.appTree.tree.setVertexProperty(newMessage.id, "role", "error");
      this.appTree.tree.setVertexProperty(newMessage.id, "text", errorMessage);
      this.appTree.tree.setVertexProperty(newMessage.id, "inProgress", false);
    }
  }
}