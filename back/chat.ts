import { cosineSimilarity } from "./tools/cosineSimilarity.ts";

import {
  Lang,
  LangVecs,
  PromptForObject,
} from "https://deno.land/x/aiwrapper@v0.0.17/mod.ts";
import { ThreadMessage } from "../shared/models.ts";
import { Agent } from "../shared/models.ts";
import { LangResultWithMessages } from "https://deno.land/x/aiwrapper@v0.0.17/src/lang/language-model.ts";

function normalizeStringForID(str: string) {
  const trimmed = str.trim();
  const lowerCased = trimmed.toLowerCase();
  const replacedSpaces = lowerCased.replace(/\s/g, "-");
  const urlFriendly = replacedSpaces.replace(/[^\w-]/g, "");
  return urlFriendly;
}

function similaritySearch(
  embeddings: Map<string, number[]>,
  queryVec: number[],
  resultsMax = 100,
  treshold = 0.7,
): string[] {
  // Iterate over embeddings and calculate similarity
  const similarities = new Map<string, number>();
  for (const [id, vec] of embeddings.entries()) {
    const similarity = cosineSimilarity(queryVec, vec);
    similarities.set(id, similarity);
  }

  // Sort similarities
  const sortedSimilarities = new Map(
    [...similarities.entries()].sort((a, b) => b[1] - a[1]),
  );

  // Return the top 10 results
  const top = [...sortedSimilarities.keys()].slice(0, resultsMax);

  // Filter results based on treshold
  const filtered = top.filter((id) => sortedSimilarities.get(id)! > treshold);
  return filtered;
}

function getKey() {

}

export class Chat {
  relatedData: string[] = [];
  embeddings = new Map<string, number[]>();
  _initObj: {} | null = null;
  tools: any[] = [];

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

  async ask(
    msg: string,
    prevMessages: ThreadMessage[] = [],
    systemPrompt: string,
    apiKey: string,
    onResult?: (result: LangResultWithMessages) => void
  ): Promise<string> {
    console.log(`Processing...`);

    const query = msg.trim();

    const lang = Lang.openai({
      apiKey,
    });
    
    const remappedMessages = [
      { role: "system", content: systemPrompt },
      ...prevMessages.map((m) => ({
        role: m.role || "user",
        content: m.text || "",
      })),
      { role: "user", content: query },
    ];

    const promptStartPerf = performance.now();
    const finalResult = await lang.chat(remappedMessages, onResult);
    const promptEndPerf = performance.now();
    console.log(`Prompt took ${promptEndPerf - promptStartPerf} milliseconds`);

    return finalResult.answer;
  }
}
