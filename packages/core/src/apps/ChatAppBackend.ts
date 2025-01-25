import { type AppConfig, type ThreadMessage } from "../models";
import Space from "../spaces/Space";
import { AgentServices } from "../agents/AgentServices.ts";
import { SimpleChatAgent } from "../agents/SimpleChatAgent.ts";
import { ThreadTitleAgent } from "../agents/ThreadTitleAgent.ts";
import { ChatAppData } from "../spaces/ChatAppData";
import AppTree from "../spaces/AppTree.ts";

export default class ChatAppBackend {
  private data: ChatAppData;
  private activeAgent: SimpleChatAgent | null = null;

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

      const messages = this.data.messages;
      this.replyToMessage(messages);
    });

    this.appTree.onEvent("stop-message", (event) => {
      if (this.activeAgent) {
        this.activeAgent.stop();
      }

      // Get the last message and set inProgress to false
      const messages = this.data.messages;
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === "assistant") {
        this.appTree.tree.setVertexProperty(lastMessage.id, "inProgress", false);
      }

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
    this.activeAgent = simpleChatAgent;
    const threadTitleAgent = new ThreadTitleAgent(agentServices, config);

    // Check if the last message is an error that we can reuse
    const lastMessage = messages[messages.length - 1];
    const messageToUse = lastMessage?.role === "error" ?
      lastMessage :
      this.data.newMessage("assistant", "thinking...");

    // @TODO: consider making TypedVertex<ThreadMessage> that can be used to set properties
    // @TODO: or consider just having data.updateMessage(message)

    // Set initial state
    this.appTree.tree.setVertexProperty(messageToUse.id, "role", "assistant");
    this.appTree.tree.setVertexProperty(messageToUse.id, "text", "thinking...");
    this.appTree.tree.setVertexProperty(messageToUse.id, "inProgress", true);
    this.appTree.tree.setVertexProperty(messageToUse.id, "configId", config.id);
    this.appTree.tree.setVertexProperty(messageToUse.id, "configName", config.name);

    try {
      // If we're retrying an error message, exclude it from the input
      const messagesToUse = lastMessage?.role === "error" ?
        messages.slice(0, -1) :
        messages;

      const messagesForLang = [
        { role: "system", text: config.instructions },
        ...messagesToUse.map((m) => ({
          role: m.role,
          text: m.text,
        }))];

      const response = await simpleChatAgent.input(messagesForLang, (resp) => {
        const wipResponse = resp as string;
        this.appTree.tree.setTransientVertexProperty(messageToUse.id, "text", wipResponse);
      }) as string;

      // Update the message with the final response
      this.appTree.tree.setVertexProperty(messageToUse.id, "text", response);
      this.appTree.tree.setVertexProperty(messageToUse.id, "inProgress", false);
      this.activeAgent = null;

      // Only add to messages array if it's a new message
      if (lastMessage?.role !== "error") {
        messages.push({ ...messageToUse, text: response });
      }

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
      this.appTree.tree.setVertexProperty(messageToUse.id, "role", "error");
      this.appTree.tree.setVertexProperty(messageToUse.id, "text", errorMessage);
      this.appTree.tree.setVertexProperty(messageToUse.id, "inProgress", false);
    }
  }
}