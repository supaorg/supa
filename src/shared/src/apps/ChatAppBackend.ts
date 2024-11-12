import { isSetPropertyOp, type VertexOperation } from "../replicatedTree/operations";
import { TreeVertex } from "../replicatedTree/TreeVertex";
import type AppTree from "../spaces/AppTree";
import Space from "../spaces/Space";
import { Lang } from 'aiwrapper';

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
    const lastMessage = messages[messages.length - 1];

    const newMessageVertex = appTree.tree.newVertex(lastMessage.id);
    appTree.tree.setVertexProperty(newMessageVertex, "_n", "message");
    appTree.tree.setVertexProperty(newMessageVertex, "createdAt", Date.now());
    appTree.tree.setVertexProperty(newMessageVertex, "text", "thinking...");
    appTree.tree.setVertexProperty(newMessageVertex, "role", "assistant");

    const lang = Lang.openai({
      apiKey: "...",
      model: "gpt-4o"
    });

    const result = await lang.chat(messages.map((m) => ({
      role: m.role,
      content: m.text,
    })), (result) => {
      appTree.tree.setVertexProperty(newMessageVertex, "text", result.answer);

      console.log(result.answer);
    });

    const newMessage = {
      id: newMessageVertex,
      role: "assistant",
      text: result.answer,
    } as ChatMessage;
    messages.push(newMessage);

    this.generateTitle(appTree, messages);
  }

  private async generateTitle(appTree: AppTree, messages: ChatMessage[]) {
    const title = appTree.tree.getVertexProperty(appTree.tree.rootVertexId, "title")?.value as string;

    const lang = Lang.openai({
      apiKey: "...",
      model: "gpt-4o"
    });

    const allMessagesInOneMessage = messages.map((m) => `**${m.role}**:\n${m.text}`).join("\n\n\n");
    
    const result = await lang.askForObject({
      title: "Create or Edit a Title",
      instructions: [
        "Read the provided message thread",
        "Look if the thread already has a title. Decide if it is good or not",
        "If not, write a new short (1-3 words) title for a chat thread based on a provided conversation",
        "Be as concise as possible. Provide only the title, with no additional comments or explanations",
        "If decide to keep the existing title, return it as is",
        "Use plain text only—no Markdown or formatting",
      ],
      content: {
        "Current Title": title,
        "Messages": allMessagesInOneMessage,
      },
      objectExamples: [{
        title: "City Farewell"
      }]
    });

    const answer = result.answerObj as { title: string };

    if (answer.title !== title) {
      appTree.tree.setVertexProperty(appTree.tree.rootVertexId, "title", answer.title);
    }
    
    const vertexIdReferencingAppTree = this.space.getVertexIdReferencingAppTree(appTree.getId());
    if (vertexIdReferencingAppTree) {
      const titleInSpace = this.space.tree.getVertexProperty(vertexIdReferencingAppTree, "_n")?.value as string;
      if (titleInSpace !== answer.title) {
        this.space.tree.setVertexProperty(vertexIdReferencingAppTree, "_n", answer.title);
      }
    }
  }

}