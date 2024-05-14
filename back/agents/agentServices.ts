import {
  Lang,
} from "https://deno.land/x/aiwrapper@v0.0.17/mod.ts";
import { LanguageModel } from "https://deno.land/x/aiwrapper@v0.0.17/src/lang/language-model.ts";
import { AppDb } from "../db/appDb.ts";

export class AgentServices {
  readonly db: AppDb;

  constructor(db: AppDb) {
    this.db = db;
  }

  async lang(model: string): Promise<LanguageModel> {
    const modelSplit = model.split("/");
    if (modelSplit.length !== 2) {
      throw new Error("Invalid model name");
    }

    const modelProvider = modelSplit[0];
    const modelName = modelSplit[1];

    switch (modelProvider) {
      case "openai":
        return Lang.openai({
          apiKey: await this.getKey(modelProvider),
          model: modelName,
        });
      case "groq":
        return Lang.groq({
          apiKey: await this.getKey(modelProvider),
          model: modelName,
        });
      case "anthropic":
        return Lang.anthropic({
          apiKey: await this.getKey(modelProvider),
          model: modelName,
        });
      case "ollama":
        return Lang.ollama({
          "url": "none",
        });
      default:
        throw new Error("Invalid model provider");
    }
  }

  async getKey(provider: string): Promise<string> {
    const providerConfig = await this.db.getProviderConfig(provider);

    if (!providerConfig) {
      throw new Error("No provider config found");
    }

    // First check if config itself contains 'apiKey'
    if ("apiKey" in providerConfig) {
      return providerConfig.apiKey as string;
    }

    // @NOTE: consider adding checks in other parts, such as user profile

    throw new Error("No API key found");
  }
}
