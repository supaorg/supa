import { Lang, LanguageModel } from 'aiwrapper';
import { providers } from "../providers.ts";
import Space from '../spaces/Space.ts';

export class AgentServices {
  readonly space: Space;

  constructor(space: Space) {
    this.space = space;
  }

  async lang(model?: string): Promise<LanguageModel> {
    let modelProvider: string;
    let modelName: string;

    if (model && model != "auto/") {
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
          model: "llama3",
        });
      case "deepseek":
        return Lang.deepseek({
          apiKey: await this.getKey(modelProvider),
          model: modelName,
        });
      default:
        throw new Error("Invalid model provider");
    }
  }

  async getKey(provider: string): Promise<string> {
    const providerConfig = this.space.getModelProviderConfig(provider);

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

  async getMostCapableModel(): Promise<
    { provider: string; model: string } | null
  > {
    const providerConfigs = this.space.getModelProviderConfigs();

    // First, openai, then groq, then anthropic
    const providerOrder = ["openai", "groq", "anthropic"];
    for (const provider of providerOrder) {
      const providerConfig = providerConfigs.find((p) => p.id === provider);
      if (providerConfig) {
        // get the default model from providers
        const defaultModel = providers.find((p) => p.id === provider)
          ?.defaultModel;
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
