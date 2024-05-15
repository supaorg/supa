import { AgentConfig } from "../../shared/models.ts";
import { Agent, AgentInput, AgentOutput, AgentResponse } from "./agent.ts";
import { AgentConfigForChat } from "./simpleChatAgent.ts";

export class ThreadTitleAgent extends Agent<AgentConfigForChat> {
  async input(
    payload: AgentInput,
    onStream?: (output: AgentOutput) => void,
  ): Promise<AgentOutput> {
    const messages = payload;

    if (!this.services.db) {
      throw new Error("No database");
    }

    const lang = await this.services.lang(this.config.targetLLM);

    const systemPrompt =
      `You write great, snappy titles. Your job is to come up with a short (1-3 words) title for a chat thread based on the conversation. 
Be as concise as possible. You MUST provide only the title, no additional comments, explanations or messages. 
If it's not clear what the title should be yet, return NO TITLE. No Markdown or formatting - only plain text is allowed.`;

    const remappedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role || "user",
        content: m.text || "",
      })),
    ];

    const promptStartPerf = performance.now();
    const finalResult = await lang.chat(remappedMessages, (res) => {
      onStream?.(res.answer);
    });
    const promptEndPerf = performance.now();
    console.log(`Prompt took ${promptEndPerf - promptStartPerf} milliseconds`);

    let answer = finalResult.answer;
    if (answer.startsWith('"') || answer.startsWith("'")) {
      answer = answer.substring(1);
    }
    if (answer.endsWith('"') || answer.endsWith("'")) {
      answer = answer.slice(0, -1);
    }

    answer = answer.substring(0, 50);

    if (answer === "NO TITLE") {
      return "";
    } else {
      return answer;
    }
  }
}