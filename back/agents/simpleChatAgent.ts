import { LangResultWithMessages } from "https://deno.land/x/aiwrapper@v0.0.20/src/lang/language-model.ts";
import { AgentConfig, ThreadMessage } from "../../shared/models.ts";
import { Agent, AgentInput, AgentOutput, AgentResponse } from "./agent.ts";

export interface AgentConfigForChat extends AgentConfig {
  targetLLM?: string;
}

export class SimpleChatAgent extends Agent<AgentConfigForChat> {
  hasStopped = false;

  async input(
    payload: AgentInput,
    onStream?: (output: AgentOutput) => void,
  ): Promise<AgentOutput> {
    this.hasStopped = false;
    const messages = payload as ThreadMessage[];

    if (!this.services.db) {
      throw new Error("No database");
    }

    const lang = await this.services.lang(this.config.targetLLM);

    let systemPrompt = this.config.instructions + "\n\n" +
      "Preferably use markdown for formatting. If you write code examples: use tick marks for inline code and triple tick marks for code blocks." +
      "\n\n" +
      "For math, use TeX with inline $ ... $ and block $$ ... $$ delimiters. If you want to show the source of TeX - wrap it in a code block" +
      "\n\n" +
      "Current date and time " + new Date().toLocaleString();

    const profile = await this.services.db.getProfile();
    if (profile) {
      systemPrompt += "\n\nUser's name is " + profile?.name;
    }

    const remappedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role || "user",
        content: m.text || "",
      })),
    ];

    const promptStartPerf = performance.now();
    const finalResult: LangResultWithMessages = await new Promise<
      LangResultWithMessages
    >((resolve, reject) => {
      lang.chat(remappedMessages, (res) => {
        if (this.hasStopped) {
          resolve(res);
          return;
        }

        onStream?.(res.answer);
      })
        .then((res) => {
          resolve(res);
        })
        .catch(reject);
    });

    const promptEndPerf = performance.now();
    console.log(`Prompt took ${promptEndPerf - promptStartPerf} milliseconds`);

    return finalResult.answer;
  }

  stop(): void {
    this.hasStopped = true;
  }
}
