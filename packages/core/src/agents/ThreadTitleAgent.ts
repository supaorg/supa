import { ThreadMessage } from "../models";
import { Agent, AgentInput, AgentOutput } from "./Agent";
import { AppConfigForChat } from "./SimpleChatAgent";

export class ThreadTitleAgent extends Agent<AppConfigForChat> {
  // @TODO: decide if I can make input more specific for agents
  async input(
    payload: AgentInput,
    onStream?: (output: AgentOutput) => void,
  ): Promise<AgentOutput> {
    const {messages, title} = payload as { messages: ThreadMessage[], title: string };

    const lang = await this.services.lang(this.config.targetLLM);

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

    return { text: answer.title };
  }

  stop(): void {
    throw new Error("Method not implemented.");
  }
}
