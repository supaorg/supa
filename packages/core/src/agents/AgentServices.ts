import { Lang, LanguageModel } from 'aiwrapper';
import { providers } from "../providers.ts";
import Space from '../spaces/Space.ts';
import { getProviderModels } from '@core/tools/providerModels.js';

export class AgentServices {
  readonly space: Space;

  constructor(space: Space) {
    this.space = space;
  }

  async lang(model?: string): Promise<LanguageModel> {
    let modelProvider: string;
    let modelName: string;

    if (model && !model.startsWith("auto")) {
      const modelSplit = model.split("/");
      if (modelSplit.length !== 2) {
        throw new Error("Invalid model name");
      }

      modelProvider = modelSplit[0];
      modelName = modelSplit[1];
    } else {
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
          model: modelName,
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

    const providerOrder = ["openai", "anthropic", "deepseek", "groq", "ollama"];
    for (const provider of providerOrder) {
      const providerConfig = providerConfigs.find((p) => p.id === provider);
      if (providerConfig) {

        const isLocalProvider = providerConfig.type === "local";
        let model;

        if (isLocalProvider) {
          // Get available models from local provider
          const models = await getProviderModels(provider, "");

          if (!models || models.length === 0) {
            throw new Error("No available models found in " + provider);
          }

          // @TODO: consider picking the most capable model from the list
          model = models[0];
        } else {
          // get the default model from providers
          model = providers.find((p) => p.id === provider)
            ?.defaultModel;

          if (!model) {
            throw new Error("No default model found for provider");
          }
        }

        return {
          provider: provider,
          model: model as string,
        };
      }
    }

    return null;
  }
}
