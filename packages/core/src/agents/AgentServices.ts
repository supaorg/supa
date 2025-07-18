import { Lang, LanguageProvider } from 'aiwrapper';
import { providers } from "../providers";
import { Space } from '../spaces/Space';
import { getProviderModels } from '../tools/providerModels';
import { splitModelString } from '../utils/modelUtils';

export class AgentServices {
  readonly space: Space;

  constructor(space: Space) {
    this.space = space;
  }

  async lang(model?: string): Promise<LanguageProvider> {
    let modelProvider: string;
    let modelName: string;

    // When a model is specified, split it into provider and model name
    // e.g model = openai/o3 or ollama/auto or custom-uuid/openai/gpt-4
    if (model && !model.startsWith("auto")) {
      const modelParts = splitModelString(model);
      if (!modelParts) {
        throw new Error("Invalid model name");
      }

      modelProvider = modelParts.providerId;
      modelName = modelParts.modelId;

      // If the provider is set but the model is "auto", find a model within the provider
      // e.g model = ollama/auto
      if (modelName.endsWith("auto")) {
        // Try to use Lang.models first for cloud providers
        if (modelProvider !== "ollama" && modelProvider !== "local") {
          const models = Lang.models.fromProvider(modelProvider);
          if (models && models.length > 0) {
            // Use the first available model
            modelName = models[0].id;
            // Skip the fallback
            return this.createLanguageProvider(modelProvider, modelName);
          }
        }

        // Fall back to legacy implementation
        const models = await getProviderModels(modelProvider, "");
        if (models.length === 0) {
          throw new Error(`No models found for provider ${modelProvider}`);
        }
        modelName = models[0]; // Use the first available model
      }
      // When no provider is specified, find the most capable model from a provider
      // model = "/auto"
    } else {
      const mostCapableModel = await this.getMostCapableModel();

      if (mostCapableModel === null) {
        throw new Error("No capable model found");
      }

      modelProvider = mostCapableModel.provider;
      modelName = mostCapableModel.model;
    }

    return this.createLanguageProvider(modelProvider, modelName);
  }

  private async createLanguageProvider(provider: string, model: string): Promise<LanguageProvider> {
    // Common configuration for API-based providers
    const options: Record<string, any> = { model };

    // Add API key for providers that require it (all except ollama)
    if (provider !== "ollama") {
      options.apiKey = await this.getKey(provider);
    }

    // Handle custom OpenAI-like providers
    if (provider.startsWith('custom-')) {
      const config = this.space.getModelProviderConfig(provider);
      if (!config || !('baseApiUrl' in config)) {
        throw new Error(`Invalid custom provider configuration for: ${provider}`);
      }

      // Create a custom OpenAI-like provider
      return Lang.openaiLike({
        apiKey: options.apiKey,
        model: model,
        baseURL: config.baseApiUrl as string,
        headers: ('customHeaders' in config) ? config.customHeaders as Record<string, string> : undefined
      });
    }

    // Check if the provider method exists on Lang
    if (typeof Lang[provider as keyof typeof Lang] === 'function') {
      // Dynamically call the provider method with the options
      return Lang[provider as keyof typeof Lang](options);
    }

    throw new Error(`Invalid model provider: ${provider}`);
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

    // Try to use Lang.models to find the most capable model
    const availableProviders = Lang.models.providers;
    const availableProviderIds = availableProviders.map(provider => provider.id);

    // Filter to providers that are configured in the space
    const configuredProviderIds = providerConfigs
      .map(config => config.id)
      .filter(id => availableProviderIds.includes(id) || id.startsWith('custom-'));

    if (configuredProviderIds.length > 0) {
      // Prioritize certain providers
      const providerOrder = ["openrouter", "openai", "anthropic", "google", "xai", "deepseek", "groq", "mistral", "ollama"];
      const sortedProviders = configuredProviderIds.sort((a, b) => {
        // Custom providers get lower priority than built-in ones
        if (a.startsWith('custom-') && !b.startsWith('custom-')) return 1;
        if (!a.startsWith('custom-') && b.startsWith('custom-')) return -1;

        const indexA = providerOrder.indexOf(a);
        const indexB = providerOrder.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      });

      for (const provider of sortedProviders) {
        if (provider === "ollama" || provider === "local") {
          continue; // Skip local providers in this path
        }

        // Handle custom providers (they don't have models in Lang.models)
        if (provider.startsWith('custom-')) {
          const config = this.space.getModelProviderConfig(provider);
          if (config && 'modelId' in config) {
            return {
              provider,
              model: config.modelId as string
            };
          }
          continue;
        }

        const models = Lang.models.fromProvider(provider);
        if (models && models.length > 0) {
          return {
            provider,
            model: models[0].id
          };
        }
      }
    }

    // Legacy implementation as fallback
    const providerOrder = ["openrouter", "openai", "anthropic", "deepseek", "groq", "ollama"];

    // Check custom providers first before trying the static providers
    const customProviders = providerConfigs.filter(config => config.id.startsWith('custom-'));
    for (const config of customProviders) {
      if ('modelId' in config) {
        return {
          provider: config.id,
          model: config.modelId as string
        };
      }
    }

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
