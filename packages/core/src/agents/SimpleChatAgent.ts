import { LangResultWithMessages } from "aiwrapper";
import { AppConfig, ThreadMessage } from "../models.ts";
import { Agent, AgentInput, AgentOutput } from "./Agent.ts";

export interface AppConfigForChat extends AppConfig {
  targetLLM?: string;
}

export class SimpleChatAgent extends Agent<AppConfigForChat> {
  hasStopped = false;

  async input(
    payload: AgentInput,
    onStream?: (output: AgentOutput) => void,
  ): Promise<AgentOutput> {
    this.hasStopped = false;
    const messages = payload as ThreadMessage[];

    const lang = await this.services.lang(this.config.targetLLM);

    // @TODO: move this to localized texts file
    let systemPrompt = this.config.instructions + "\n\n" +
      "Preferably use markdown for formatting. If you write code examples: use tick marks for inline code and triple tick marks for code blocks." +
      "\n\n" +
      "For math, use TeX with inline $ ... $ and block $$ ... $$ delimiters. If you want to show the source of TeX - wrap it in a code block" +
      "\n\n" +
      "Current date and time " + new Date().toLocaleString();

    /*
    const profile = await this.services.db.getProfile();
    if (profile) {
      systemPrompt += "\n\nUser's name is " + profile?.name;
    }
    */

    // @TODO: add meta data to messages with the current date, model, config name, etc

    const remappedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => {
        // Validate and normalize the role - only allow "assistant" or "user"
        let normalizedRole = m.role || "user";
        if (normalizedRole !== "assistant" && normalizedRole !== "user") {
          normalizedRole = "user";
        }
        
        return {
          role: normalizedRole,
          content: m.text || "",
        };
      }),
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

        onStream?.({
          text: res.answer,
          thinking: res.thinking
        });
      })
        .then((res) => {          
          resolve(res);
        })
        .catch(reject);
    });

    const promptEndPerf = performance.now();
    console.log(`Prompt took ${promptEndPerf - promptStartPerf} milliseconds`);

    return {
      text: finalResult.answer,
      thinking: finalResult.thinking
    };
  }

  stop(): void {
    this.hasStopped = true;
  }
}
