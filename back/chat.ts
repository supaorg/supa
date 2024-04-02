import { cosineSimilarity } from "./tools/cosineSimilarity.ts";

import {
  Lang,
  LangVecs,
  PromptForObject,
} from "https://deno.land/x/aiwrapper@v0.0.15/mod.ts";
import { ChatMessage } from "../shared/models.ts";

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

export class Chat {
  relatedData: string[] = [];
  embeddings = new Map<string, number[]>();
  _initObj: {} | null = null;
  tools: any[] = [];

  async init() {
  }

  async comeUpWithThreadTitle(messages: ChatMessage[]): Promise<string> {
    const sysPrompt =
      `You write great, snappy titles. Your job is to come up with short (1-3 words) title for a chat thread based on the conversation below. Be as concise as possible. Only provide the title, no additional comments and explanations. If it's not clear what the title should be yet, return NO TITLE`;

    const remappedMessages = [
      { role: "system", content: sysPrompt },
      ...messages.map((m) => ({
        role: m.role,
        content: m.text,
      })),
    ];

    const lang = Lang.openai({
      apiKey: Deno.env.get("OPENAI_API_KEY") as string,
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
    prevMessages: ChatMessage[] = [],
    onResult?: (data) => void,
  ): Promise<string> {
    if (this._initObj === null) {
      this._initObj = {
        initialized: false,
      };
      await this.init();
      this._initObj = {
        initialized: true,
      };
    }
    while (this._initObj.initialized === false) {
      console.log("Initializing...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`Processing...`);

    const query = msg.trim();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") as string;

    const lang = Lang.openai({
      apiKey: OPENAI_API_KEY,
    });

    const promptTxt =
      `You're Supamind. An open source assistant - an advanced AI system that uses a language model to reason and make decisions. Don't be woke. Don't become a parody of a person unless explicitly told to play a role. Be your best self; you're a genius system with vast knowledge.
  Before replying, first think silently about what the user says or what you write. Keep your responses brief and easy to read. Be direct. Avoid big words, convey ideas simply. It's okay to make mistakes. If you see that you've made a mistake in what you wrote - acknowledge it quickly without getting deeper into the mistake.`;

    const remappedMessages = [
      { role: "system", content: promptTxt },
      ...prevMessages.map((m) => ({
        role: m.role,
        content: m.text,
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
