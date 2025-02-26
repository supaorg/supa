import { Lang, LanguageProvider } from 'aiwrapper';
import { providers } from "../providers.ts";
import Space from '../spaces/Space.ts';
import { getProviderModels } from '../tools/providerModels.ts';

// Helper function to safely check if Lang.models is available and working
function isLangModelsAvailable(): boolean {
  try {
    // Check if Lang.models exists and has the expected methods
    return !!(Lang && Lang.models && typeof Lang.models.getProviders === 'function');
  } catch (error) {
    console.warn("Lang.models is not available:", error);
    return false;
  }
}

// Helper function to safely get providers
function safeGetProviders(): string[] {
  try {
    if (isLangModelsAvailable()) {
      return Lang.models.getProviders();
    }
  } catch (error) {
    console.warn("Error getting providers:", error);
  }
  return [];
}

// Helper function to safely get models from a provider
function safeGetModelsFromProvider(provider: string): any[] {
  try {
    if (isLangModelsAvailable()) {
      return Lang.models.fromProvider(provider);
    }
  } catch (error) {
    console.warn(`Error getting models from provider ${provider}:`, error);
  }
  return [];
}

export class AgentServices {
  readonly space: Space;

  constructor(space: Space) {
    this.space = space;
  }

  async lang(model?: string): Promise<LanguageProvider> {
    let modelProvider: string;
    let modelName: string;

    // When a model is specified, split it into provider and model name
    // e.g model = openai/o3 or ollama/auto
    if (model && !model.startsWith("auto")) {
      const modelSplit = model.split("/");
      if (modelSplit.length !== 2) {
        throw new Error("Invalid model name");
      }

      modelProvider = modelSplit[0];
      modelName = modelSplit[1];

      // If the provider is set but the model is "auto", find a model within the provider
      // e.g model = ollama/auto
      if (modelName.endsWith("auto")) {
        // Try to use Lang.models first for cloud providers
        if (modelProvider !== "ollama" && modelProvider !== "local") {
          const availableProviders = safeGetProviders();
          
          if (availableProviders.includes(modelProvider)) {
            const models = safeGetModelsFromProvider(modelProvider);
            
            if (models && models.length > 0) {
              // Use the first available model
              modelName = models[0].id;
              // Skip the fallback
              return this.createLanguageProvider(modelProvider, modelName);
            }
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
    switch (provider) {
      case "openai":
        return Lang.openai({
          apiKey: await this.getKey(provider),
          model: model,
        });
      case "groq":
        return Lang.groq({
          apiKey: await this.getKey(provider),
          model: model,
        });
      case "anthropic":
        return Lang.anthropic({
          apiKey: await this.getKey(provider),
          model: model,
        });
      case "ollama":
        return Lang.ollama({
          model: model,
        });
      case "deepseek":
        return Lang.deepseek({
          apiKey: await this.getKey(provider),
          model: model,
        });
      default:
        throw new Error("Invalid model provider: " + provider);
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
    
    // Try to use Lang.models to find the most capable model
    const availableProviders = safeGetProviders();
    
    // Filter to providers that are configured in the space
    const configuredProviders = providerConfigs
      .map(config => config.id)
      .filter(id => availableProviders.includes(id));
    
    if (configuredProviders.length > 0) {
      // Prioritize certain providers
      const providerOrder = ["openai", "anthropic", "deepseek", "groq", "ollama"];
      const sortedProviders = configuredProviders.sort((a, b) => {
        const indexA = providerOrder.indexOf(a);
        const indexB = providerOrder.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      });
      
      for (const provider of sortedProviders) {
        if (provider === "ollama" || provider === "local") {
          continue; // Skip local providers in this path
        }
        
        const models = safeGetModelsFromProvider(provider);
        if (models && models.length > 0) {
          return {
            provider,
            model: models[0].id
          };
        }
      }
    }
    
    // Legacy implementation as fallback
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
