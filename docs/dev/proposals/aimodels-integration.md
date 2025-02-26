# AIModels Integration Specification

## Overview

This document outlines the integration of the AIModels functionality (available through `Lang.models` in AIWrapper) into Supa's core model discovery and selection logic. The integration focuses on replacing provider-specific API calls with standardized model metadata from AIWrapper while maintaining backward compatibility with the current implementation.

This specification intentionally excludes UI enhancements, which can be implemented in a future phase once the core integration is stable. The primary goal is to establish a solid foundation for model discovery and selection that leverages the rich metadata available through `Lang.models` without disrupting the current user experience.

## Current Architecture

Currently, Supa handles models and providers in the following way:

1. **Model Providers**: Defined in `packages/core/src/providers.ts` as a static list with properties like `id`, `name`, `access`, etc.
2. **Model Discovery**: Implemented in `packages/core/src/tools/providerModels.ts` which fetches models from each provider's API
3. **Model Selection**: Implemented in `packages/core/src/agents/AgentServices.ts` which selects models based on availability and a fixed provider order

This approach has several limitations:
- No standardized way to filter models by capability
- Limited information about model properties (context window, capabilities, etc.)
- No consistent way to compare models across providers
- Each provider requires custom fetching logic

## Proposed Architecture

The AIModels functionality (accessible through `Lang.models` from AIWrapper) provides a comprehensive database of AI models with standardized metadata. Importantly, `Lang.models` is already pre-filtered to only include models with chat capability. By integrating it, we can:

1. Replace or augment the current model discovery mechanism
2. Enable capability-based model filtering (beyond the default chat capability)
3. Provide users with better model selection options
4. Standardize model information across the application

## Integration Plan

### 1. Direct Usage of Lang.models

Instead of creating additional abstraction layers, we'll use `Lang.models` directly throughout the codebase. The AIModels API is already clean and intuitive:

```typescript
// Examples of direct Lang.models usage:

// Get all chat-capable models (all models in Lang.models have chat capability)
const allChatModels = Lang.models;

// Get all providers that have chat-capable models
const allProviders = Lang.models.getProviders();

// Get models from a specific provider
const openAIModels = Lang.models.fromProvider('openai');

// Get models with specific capabilities
const imageInputModels = Lang.models.can('img-in');

// Get models with minimum context window
const largeContextModels = Lang.models.withMinContext(100000);

// Get a specific model by ID
const gpt4Model = Lang.models.id('gpt-4');

// Chain filters
const largeOpenAIModels = Lang.models.fromProvider('openai').withMinContext(100000);
```

### 2. Update providerModels.ts

```typescript
// packages/core/src/tools/providerModels.ts
import { Lang } from 'aiwrapper';

export function getProviderModels(
  provider: string,
  key: string,
  signal?: AbortSignal,
): Promise<string[]> {
  // For cloud providers, use Lang.models (which has complete data)
  // Check if this provider is in the list of providers with chat-capable models
  const availableProviders = Lang.models.getProviders();
  
  if (availableProviders.includes(provider) && provider !== "ollama" && provider !== "local") {
    const models = Lang.models.fromProvider(provider);
    return Promise.resolve(models.map(model => model.id));
  }
  
  // For local providers like Ollama, continue using API calls
  switch (provider) {
    case "ollama":
      return getProviderModels_ollama();
    case "local":
      // Handle any other local providers
      return Promise.resolve([]);
    default:
      // For any new cloud providers not explicitly handled above
      const models = Lang.models.fromProvider(provider);
      if (models.length > 0) {
        return Promise.resolve(models.map(model => model.id));
      }
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Keep only the implementations needed for local providers
async function getProviderModels_ollama(): Promise<string[]> {
  try {
    const response = await fetch("http://localhost:11434/api/tags");
    const data = await response.json();
    return data.models.map((model: { name: string }) => model.name);
  } catch (err) {
    console.error("Fetch error:", err);
    return [];
  }
}

// Remove other provider-specific implementations as they're no longer needed
```

### 3. Update AgentServices to Use Lang.models and Lang Providers Correctly

```typescript
// packages/core/src/agents/AgentServices.ts (partial)
import { Lang, LanguageProvider } from 'aiwrapper';
import { providers } from "../providers.ts";
import Space from '../spaces/Space.ts';

export class AgentServices {
  // ... existing code ...

  async lang(model?: string): Promise<LanguageProvider> {
    let modelProvider: string;
    let modelName: string;

    // @TODO: consider supporting auto provider and specified model, eg: auto/deepseek-r1

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
        if (["ollama", "local"].includes(modelProvider)) {
          // For local providers, use the API to get available models
          const models = await getProviderModels(modelProvider, "");
          if (models.length === 0) {
            throw new Error(`No models found for provider ${modelProvider}`);
          }
          modelName = models[0];
        } else {
          // For cloud providers, use Lang.models
          const providerModels = Lang.models.fromProvider(modelProvider);
          if (providerModels.length === 0) {
            throw new Error(`No models found for provider ${modelProvider}`);
          }
          modelName = providerModels[0].id;
        }
      }
    // When no provider is specified, find the most capable model from a provider
    } else {
      const mostCapableModel = await this.getMostCapableModel();

      if (mostCapableModel === null) {
        throw new Error("No capable model found");
      }

      modelProvider = mostCapableModel.provider;
      modelName = mostCapableModel.model;
    }

    // Get the provider config
    const providerConfig = this.space.getModelProviderConfig(modelProvider);
    if (!providerConfig) {
      throw new Error(`Provider ${modelProvider} not configured`);
    }

    // Create the language provider instance using Lang[providerId]
    // Similar to the current switch statement but using dynamic access
    const options: any = {};
    
    if (providerConfig.type === "cloud" && "apiKey" in providerConfig) {
      options.apiKey = providerConfig.apiKey;
    } else if (providerConfig.type === "local" && "apiUrl" in providerConfig) {
      options.baseURL = providerConfig.apiUrl;
    }

    // Create and return the LanguageProvider instance
    return Lang[modelProvider]({
      ...options,
      model: modelName,
    });
  }

  // Update getMostCapableModel to use Lang.models directly
  async getMostCapableModel(): Promise<
    { provider: string; model: string } | null
  > {
    const providerConfigs = this.space.getModelProviderConfigs();
    
    // Define provider preference order - same as current implementation
    const providerOrder = ["openai", "anthropic", "deepseek", "groq", "ollama"];
    
    // Try providers in order of preference - similar to current implementation
    for (const provider of providerOrder) {
      // Skip providers that aren't available in Lang.models (except for local providers)
      const isLocalProvider = provider === "ollama" || provider === "local";
      if (!isLocalProvider && !Lang.models.getProviders().includes(provider)) {
        continue;
      }
      
      const providerConfig = providerConfigs.find((p) => p.id === provider);
      if (providerConfig) {
        let model;

        if (isLocalProvider) {
          // Get available models from local provider
          const models = await getProviderModels(provider, "");

          if (!models || models.length === 0) {
            continue; // Try the next provider
          }

          // Use the first available model
          model = models[0];
        } else {
          // For cloud providers, get the default model from providers.ts
          // This matches the current implementation
          model = providers.find((p) => p.id === provider)?.defaultModel;

          if (!model) {
            // If no default model is found, try to get one from Lang.models
            const providerModels = Lang.models.fromProvider(provider);
            
            if (providerModels.length === 0) {
              continue; // Try the next provider
            }
            
            model = providerModels[0].id;
          }
        }

        return {
          provider: provider,
          model: model,
        };
      }
    }

    return null;
  }
}
```

## Implementation Phases

### Phase 1: Core Integration

1. Update to the latest AIWrapper version (0.1.3+) to access the `getProviders()` functionality
2. Update `providerModels.ts` to use `Lang.models` for cloud providers:
   - Replace provider-specific API calls with `Lang.models` queries
   - Keep Ollama implementation for local models
   - Add error handling for cases where providers aren't available
3. Update `AgentServices` to use `Lang.models` and `getProviders()` directly:
   - Modify `getMostCapableModel()` to use provider preference order with `Lang.models`
   - Update `lang()` method to handle both local and cloud providers
   - Ensure backward compatibility with existing model references
4. Basic tests to ensure everything works as expected:
   - Test with each supported provider
   - Verify that default models are correctly selected
   - Check that local providers like Ollama still work

### Phase 2: Testing and Refinement

1. Comprehensive testing with all supported providers:
   - Test with valid and invalid API keys
   - Test with providers that have no available models
   - Test with custom model IDs
2. Error handling and fallbacks:
   - Implement graceful fallbacks when preferred providers aren't available
   - Add clear error messages for configuration issues
   - Handle network errors when fetching models
3. Performance optimization:
   - Consider caching `Lang.models` results if needed
   - Optimize provider availability checks
4. Documentation:
   - Update developer documentation
   - Document the new model selection logic

## Error Handling and Edge Cases

The integration should handle the following edge cases:

1. **Provider Not Available**: If a provider in the preference order isn't available in `Lang.models.getProviders()`, skip it and try the next one.

2. **No Models Found**: If no models are found for a provider, continue to the next provider in the preference order.

3. **Invalid Model Reference**: If a user specifies a model that doesn't exist, provide a clear error message and suggest alternatives.

4. **API Configuration Issues**: Handle cases where API keys are missing or invalid with appropriate error messages.

5. **Network Errors**: Gracefully handle network errors when fetching models from local providers like Ollama.

6. **Custom Models**: Support custom fine-tuned models by checking if they exist in `Lang.models` first, and if not, attempt to use them anyway (the provider will validate).

## Migration Strategy

To ensure a smooth transition from the current implementation to the new AIModels integration, we'll follow these steps:

### 1. Parallel Implementation

Initially, we'll implement the new functionality alongside the existing code:

```typescript
// Example of parallel implementation in providerModels.ts
export function getProviderModels(
  provider: string,
  key: string,
  signal?: AbortSignal,
): Promise<string[]> {
  // Try the new implementation first
  try {
    // For cloud providers, use Lang.models
    const availableProviders = Lang.models.getProviders();
    
    if (availableProviders.includes(provider) && provider !== "ollama" && provider !== "local") {
      const models = Lang.models.fromProvider(provider);
      return Promise.resolve(models.map(model => model.id));
    }
  } catch (error) {
    console.warn("AIModels integration failed, falling back to legacy implementation", error);
    // Fall back to the existing implementation
  }
  
  // Existing implementation as fallback
  switch (provider) {
    case "openai":
      return getProviderModels_openai(key, signal);
    // ... other cases
  }
}
```

### 2. Feature Flag

Add a feature flag to control which implementation is used:

```typescript
const USE_AIMODELS = true; // Can be controlled via configuration

export function getProviderModels(
  provider: string,
  key: string,
  signal?: AbortSignal,
): Promise<string[]> {
  if (USE_AIMODELS) {
    // New implementation
    // ...
  } else {
    // Legacy implementation
    // ...
  }
}
```

### 3. Gradual Rollout

1. Enable the new implementation in development and testing environments
2. Collect feedback and fix any issues
3. Enable for a small percentage of users in production
4. Gradually increase the percentage as confidence grows
5. Eventually remove the legacy implementation

### 4. Monitoring and Rollback Plan

- Add logging to track any issues with the new implementation
- Monitor error rates and user feedback
- Have a clear rollback plan if significant issues are discovered
- Maintain the legacy implementation until the new one is proven stable

This migration strategy minimizes risk by allowing us to gradually transition to the new implementation while maintaining the ability to fall back to the existing code if needed.

## Questions and Considerations

1. **Local Models**: Should we still use the provider API for local models like Ollama, or should we rely solely on the models in `Lang.models`?
2. **Custom Models**: How do we handle custom fine-tuned models that may not be in the `Lang.models` database?
3. **Performance**: Is there any need to cache results from `Lang.models` queries, or is it already optimized?
4. **Updates**: How frequently is the `Lang.models` database updated with new models from providers?

## Acceptance Criteria

1. Model discovery works for all supported providers
2. Model selection is consistent across the application
3. All model metadata for cloud providers is sourced from `Lang.models`
4. Backward compatibility is maintained for existing model references
5. Local providers like Ollama continue to work as expected

## Conclusion

Integrating the AIModels functionality through direct use of `Lang.models` will provide a more robust and standardized approach to model selection and discovery in Supa. The implementation prioritizes:

1. **Maintaining compatibility** with the current implementation, particularly the provider preference order and default model selection
2. **Enhancing capabilities** by leveraging `Lang.models` for cloud providers while keeping the existing approach for local providers
3. **Simplifying code** by removing provider-specific implementations for cloud providers
4. **Providing a foundation** for future enhancements without disrupting the current user experience

This approach ensures a smooth transition from the current implementation while adding valuable standardized model metadata and discovery capabilities. By focusing on core integration without UI changes, we can deliver these improvements with minimal risk and maximum backward compatibility.

## Future Enhancements

Once the core integration is complete and stable, several enhancements could be built on top of it:

### 1. Advanced Model Selection UI

- Add filtering by model capabilities (image input/output, function calling, etc.)
- Display context window sizes and other model metadata
- Provide visual comparison between models

### 2. Intelligent Model Recommendations

- Suggest models based on the user's task or prompt content
- Recommend models based on performance characteristics (speed, quality, cost)
- Auto-select the most appropriate model for specific use cases

### 3. Cost Optimization

- Display estimated costs for different models
- Implement cost tracking and budgeting features
- Suggest more cost-effective alternatives for specific tasks

### 4. Model Capability Discovery

- Allow users to explore what different models can do
- Provide examples of capabilities like image generation, code completion, etc.
- Create a model playground to test different capabilities

These future enhancements would build upon the solid foundation established by the core integration, leveraging the rich metadata available through `Lang.models` to provide users with more powerful and intuitive ways to interact with AI models. 