import {
  Lang,
} from "https://deno.land/x/aiwrapper@v0.0.17/mod.ts";
import { ThreadMessage } from "../shared/models.ts";

export class Chat {
  relatedData: string[] = [];
  embeddings = new Map<string, number[]>();
  _initObj: {} | null = null;
  tools: any[] = [];

  // @TODO: make this into an agent
  async comeUpWithThreadTitle(messages: ThreadMessage[], apiKey: string): Promise<string> {
    const sysPrompt =
      `You write great, snappy titles. Your job is to come up with short (1-3 words) title for a chat thread based on the conversation below. Be as concise as possible. Only provide the title, no additional comments and explanations. If it's not clear what the title should be yet, return NO TITLE`;

    const remappedMessages = [
      { role: "system", content: sysPrompt },
      ...messages.map((m) => ({
        role: m.role || "user",
        content: m.text || "",
      })),
    ];

    const lang = Lang.openai({
      apiKey,
      systemPrompt: sysPrompt,
    });

    const result = await lang.chat(remappedMessages);

    let answer = result.answer;
    if (answer.startsWith('"') || answer.startsWith("'")) {
      answer = answer.substring(1);
    }
    if (answer.endsWith('"') || answer.endsWith("'")) {
      answer = answer.slice(0, -1);
    }

    if (result.answer === "NO TITLE") {
      return "";
    } else {
      return answer;
    }
  }
}
