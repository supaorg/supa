import { Agent, AgentOutput, AgentResponse, AgentInput } from './agent.ts';

import {
  Lang,
  LangVecs,
  PromptForObject,
} from "https://deno.land/x/aiwrapper@v0.0.15/mod.ts";
import { ThreadMessage } from "@shared/models.ts";
import { LangResultWithMessages } from "https://deno.land/x/aiwrapper@v0.0.15/src/lang/language-model.ts";

export class AgentChatResponse {
  private done: Promise<void>;
  private handle: any;

  constructor(stream: any) {
    this.handle = stream;
    this.done = new Promise((resolve, reject) => {
      this.handle.on('end', resolve);
      this.handle.on('error', reject);
    });
  }

  onStream(callback: (message: any) => void) {
    // Bind the callback to 'data' event on the stream
    this.handle.on('data', callback);
  }

  finished() {
    // Return the promise which is completed on stream end.
    return this.done;
  }
}

interface AgentConfigWithCloudModel {
  models: {
    model: string;
  }[],
  instructions: string;
}

export class SimpleChatAgent extends Agent<AgentConfigWithCloudModel> {
  async input(payload: AgentInput, onStream?: (output: AgentOutput) => void): Promise<AgentOutput> {
    const messages = payload;

    if (!this.services.db) {
      throw new Error("No database");
    }

    const profile = await this.services.db.getProfile();

    const lang = Lang.openai({
      apiKey: this.services.db.getOpenaiKey(),
    });

    // @TODO: get the user name from the agent, not config
    const systemPrompt = this.config.instructions + "\n\n" +
    "Preferably use markdown for formatting. If you write code examples: use tick marks for inline code and triple tick marks for code blocks." +
    "\n\n" +
    "User name is " + profile.name;

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