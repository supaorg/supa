import { AgentConfig } from "../../shared/models.ts";
import { Agent, AgentInput, AgentOutput, AgentResponse } from "./agent.ts";

interface AgentConfigForChat extends AgentConfig {
  targetLLM?: string;
}

export class SimpleChatAgent extends Agent<AgentConfigForChat> {
  async input(
    payload: AgentInput,
    onStream?: (output: AgentOutput) => void,
  ): Promise<AgentOutput> {
    const messages = payload;

    if (!this.services.db) {
      throw new Error("No database");
    }

    const lang = await this.services.lang(this.config.targetLLM);

    let systemPrompt = this.config.instructions + "\n\n" +
      "Preferably use markdown for formatting. If you write code examples: use tick marks for inline code and triple tick marks for code blocks.";

    const profile = await this.services.db.getProfile();
    if (profile) {
      systemPrompt += "\n\nUser name is " + profile?.name;
    }

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

    return finalResult.answer;
  }
}
