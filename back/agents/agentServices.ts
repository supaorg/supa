import { Lang } from "https://deno.land/x/aiwrapper@v0.0.20/mod.ts";
import { LanguageModel } from "https://deno.land/x/aiwrapper@v0.0.20/src/lang/language-model.ts";
import { AppDb } from "../db/appDb.ts";
import { providers } from "../providers.ts";

export class AgentServices {
  readonly db: AppDb;

  constructor(db: AppDb) {
    this.db = db;
  }

  async lang(model?: string): Promise<LanguageModel> {
    let modelProvider: string;
    let modelName: string;

    if (model) {
      const modelSplit = model.split("/");
      if (modelSplit.length !== 2) {
        throw new Error("Invalid model name");
      }

      modelProvider = modelSplit[0];
      modelName = modelSplit[1];
    } else {
      // @TODO: get a list of available providers and choose the best one with the most capable model
      const mostCapableModel = await this.getMostCapableModel();
      
      if (mostCapableModel === null) {
        throw new Error("No capable model found");
      }

      modelProvider = mostCapableModel.provider;
      modelName = mostCapableModel.model;
    }

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
          model: 'llama3',
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

  async getMostCapableModel(): Promise<{ provider: string; model: string; } | null> {
    const providerConfigs = await this.db.getModelProviders();

    // First, openai, then groq, then anthropic
    const providerOrder = ["openai", "groq", "anthropic"];
    for (const provider of providerOrder) {
      const providerConfig = providerConfigs.find((p) => p.id === provider);
      if (providerConfig) {
        // get the default model from providers
        const defaultModel = providers.find((p) => p.id === provider)?.defaultModel;
        if (!defaultModel) {
          throw new Error("No default model found for provider");
        }

        return {
          provider: provider,
          model: defaultModel,
        };
      }
    }

    return null;
  }
}
