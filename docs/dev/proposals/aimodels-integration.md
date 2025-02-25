# AIModels Integration Specification

## Overview

This document outlines the integration of the AIModels functionality (available through `Lang.models` in AIWrapper) into Supa, replacing the current model discovery and selection logic with a more robust and standardized approach.

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

### 2. Update AgentServices to Use Lang.models and Lang Providers Correctly

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
      if (modelName === "auto") {
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
    // This is different from Lang.models which is just metadata
    const options = {
      apiKey: providerConfig.apiKey || "",
      // Add other provider-specific options here
    };

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
    
    // Get all available providers with chat-capable models
    const availableProviders = Lang.models.getProviders();
    
    // Define provider preference order
    const providerOrder = ["openai", "anthropic", "deepseek", "groq", "ollama"];
    
    // Sort providers based on preference order
    const sortedProviders = [...availableProviders].sort((a, b) => {
      const aIndex = providerOrder.indexOf(a);
      const bIndex = providerOrder.indexOf(b);
      
      // If both providers are in the preference list, sort by preference
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // If only one provider is in the preference list, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // If neither provider is in the preference list, keep original order
      return 0;
    });

    // Try providers in order of preference
    for (const provider of sortedProviders) {
      const providerConfig = providerConfigs.find((p) => p.id === provider);
      if (providerConfig) {
        const isLocalProvider = providerConfig.type === "local";
        let model;

        if (isLocalProvider) {
          // For local providers, use the API to get available models
          const models = await getProviderModels(provider, "");

          if (!models || models.length === 0) {
            continue; // Try the next provider
          }

          model = models[0];
        } else {
          // For cloud providers, use Lang.models
          const providerModels = Lang.models.fromProvider(provider);
          
          if (providerModels.length === 0) {
            continue; // Try the next provider
          }
          
          // Get the first model (or could implement more sophisticated selection)
          model = providerModels[0].id;
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

### 3. Enhance Existing Model Selection UI

Instead of creating a new component, we'll enhance the existing model selection UI to leverage `Lang.models`. Here's how we'll modify the current components:

#### 3.1 Update providerModels.ts

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
  
  if (availableProviders.includes(provider)) {
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

#### 3.2 Update ModelProviderSelector.svelte

```svelte
<!-- packages/client/src/lib/comps/models/ModelProviderSelector.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { Lang } from 'aiwrapper';
  import type { ModelProvider, ModelProviderConfig } from "@core/models";
  import ModelSelectCard from "./ModelSelectCard.svelte";
  import AutoModelSelectCard from "./AutoModelSelectCard.svelte";
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import { providers } from "@core/providers";

  let {
    selectedModel,
    onModelSelect,
  }: {
    selectedModel: string | null;
    onModelSelect: (model: string) => void;
  } = $props();

  let setupProviders: {
    provider: ModelProvider;
    config: ModelProviderConfig;
  }[] = $state([]);

  type SelectedPair = {
    providerId: string;
    model: string;
  };

  let selectedPair: SelectedPair | null = $state(null);

  onMount(async () => {
    const configs = $currentSpaceStore?.getModelProviderConfigs();
    if (!configs) return;

    // Get all providers with chat-capable models from Lang.models
    const availableProviders = Lang.models.getProviders();
    
    // Keep the providers that have configs and are available in Lang.models
    // or are local providers (like Ollama)
    setupProviders = providers
      .filter((provider) => 
        configs.some((config) => config.id === provider.id) && 
        (availableProviders.includes(provider.id) || provider.type === "local")
      )
      .map((provider) => ({
        provider,
        config: configs.find((config) => config.id === provider.id)!,
      }));

    console.log("setupProviders", setupProviders);

    if (selectedModel) {
      const [providerId, model] = selectedModel.split("/");
      selectedPair = { providerId, model };
    }
  });

  // ... rest of the component ...
</script>

<!-- ... rest of the template ... -->
```

#### 3.3 Enhance ModelSelectCard.svelte

```svelte
<!-- packages/client/src/lib/comps/models/ModelSelectCard.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { Lang } from 'aiwrapper';
  import type { ModelProvider, ModelProviderConfig } from "@core/models";
  import { getProviderModels } from "@core/tools/providerModels";

  let {
    provider,
    config,
    selected,
    onSelect,
    modelId = $bindable(),
  }: {
    provider: ModelProvider;
    config: ModelProviderConfig;
    selected: boolean;
    onSelect: (providerId: string, model: string) => void;
    modelId: string | null;
  } = $props();

  let prevSelectedModelId: string | null = null;
  let models = $state<string[]>([]);
  let showModels = $state(false);
  let showAdvancedFilters = $state(false);
  
  // New state for advanced filtering
  let minContextSize = $state(0);
  let selectedCapabilities = $state<string[]>([]);
  let filteredModels = $state<any[]>([]);
  
  // Available capabilities to filter by (beyond chat)
  const availableCapabilities = ['img-in', 'img-out', 'function-out', 'json-out'];

  onMount(async () => {
    // Get basic model IDs as before
    models = await getProviderModels(
      provider.id,
      config.type !== "cloud" ? "" : config.apiKey,
    );
    
    // Also get full model objects from Lang.models for advanced filtering
    updateFilteredModels();
  });
  
  function updateFilteredModels() {
    // Start with all models from this provider
    let filtered = Lang.models.fromProvider(provider.id);
    
    // Apply context window filter if set
    if (minContextSize > 0) {
      filtered = filtered.withMinContext(minContextSize);
    }
    
    // Apply capability filters
    for (const capability of selectedCapabilities) {
      filtered = filtered.can(capability);
    }
    
    // Store the filtered models
    filteredModels = filtered;
    
    // If we're using advanced filtering, update the models list
    if (showAdvancedFilters) {
      models = filteredModels.map(model => model.id);
    }
  }
  
  function toggleCapability(capability: string) {
    if (selectedCapabilities.includes(capability)) {
      selectedCapabilities = selectedCapabilities.filter(c => c !== capability);
    } else {
      selectedCapabilities = [...selectedCapabilities, capability];
    }
    updateFilteredModels();
  }

  // ... existing functions ...
</script>

<div
  class="rounded {selected
    ? 'border border-primary-500'
    : 'border border-surface-500'}"
>
  <!-- ... existing provider selection UI ... -->
  
  <div>
    {#if selected}
      {#if showModels}
        <div class="p-4 space-y-4">
          <!-- Toggle for advanced filtering -->
          {#if provider.id !== "ollama" && provider.id !== "local"}
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium">Advanced Filtering</span>
              <button 
                class="btn btn-sm preset-outlined-surface-500"
                onclick={() => {
                  showAdvancedFilters = !showAdvancedFilters;
                  updateFilteredModels();
                }}
              >
                {showAdvancedFilters ? 'Simple View' : 'Advanced View'}
              </button>
            </div>
          {/if}
          
          <!-- Advanced filtering UI -->
          {#if showAdvancedFilters}
            <div class="space-y-4 p-2 bg-surface-200-700-token rounded">
              <!-- Context window filter -->
              <div>
                <label class="text-sm font-medium">Minimum Context Window</label>
                <div class="flex items-center gap-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="200000" 
                    step="1000" 
                    bind:value={minContextSize}
                    on:change={updateFilteredModels}
                    class="w-full"
                  />
                  <span class="text-sm">{minContextSize === 0 ? 'Any' : minContextSize.toLocaleString()}</span>
                </div>
              </div>
              
              <!-- Capability filters -->
              <div>
                <label class="text-sm font-medium">Additional Capabilities</label>
                <div class="grid grid-cols-2 gap-2 mt-1">
                  {#each availableCapabilities as capability}
                    <label class="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={selectedCapabilities.includes(capability)}
                        on:change={() => toggleCapability(capability)}
                      />
                      <span class="text-sm">{capability}</span>
                    </label>
                  {/each}
                </div>
              </div>
              
              <!-- Model cards with detailed info -->
              <div class="space-y-2 max-h-60 overflow-y-auto">
                {#each filteredModels as model}
                  <div 
                    class="p-2 rounded cursor-pointer {modelId === model.id ? 'bg-primary-500/20' : 'bg-surface-300-600-token'}"
                    onclick={() => onChangeModel(model.id)}
                  >
                    <div class="font-medium">{model.name}</div>
                    <div class="text-xs">Context: {model.context.total.toLocaleString()} tokens</div>
                    <div class="flex flex-wrap gap-1 mt-1">
                      {#each model.can as capability}
                        <span class="text-xs px-1.5 py-0.5 rounded bg-surface-400-500-token">{capability}</span>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {:else}
            <!-- Original simple dropdown -->
            <select
              class="select rounded-container"
              size={provider.defaultModel ? models.length : models.length + 1}
              value={!modelId || modelId === provider.defaultModel
                ? "auto"
                : modelId}
              onchange={(e) => onChangeModel(e.currentTarget.value)}
            >
              <option value="auto"
                >{provider.defaultModel || "Auto"} (default)</option
              >
              {#each models.filter((model) => model !== provider.defaultModel && model) as model}
                <option value={model}>{model}</option>
              {/each}
            </select>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>
```

## Implementation Phases

### Phase 1: Core Integration

1. Update to the latest AIWrapper version (0.1.3+) to access the `getProviders()` functionality
2. Update `providerModels.ts` to use `Lang.models` for cloud providers
3. Update `AgentServices` to use `Lang.models` and `getProviders()` directly
4. Basic tests to ensure everything works as expected

### Phase 2: UI Enhancement

1. Update `ModelProviderSelector.svelte` to use `Lang.models.getProviders()`
2. Enhance `ModelSelectCard.svelte` with advanced filtering options
3. Add model capability and context window information to the UI
4. Ensure backward compatibility with existing model references

### Phase 3: Enhanced Features

1. Add model comparison functionality
2. Implement "recommended model" suggestions based on use case
3. Add cost estimation based on token usage and model pricing

## Questions and Considerations

1. **Local Models**: Should we still use the provider API for local models like Ollama, or should we rely solely on the models in `Lang.models`?
2. **Custom Models**: How do we handle custom fine-tuned models that may not be in the `Lang.models` database?
3. **Performance**: Is there any need to cache results from `Lang.models` queries, or is it already optimized?
4. **UI Design**: How much model information should we expose to users in the UI?
5. **Updates**: How frequently is the `Lang.models` database updated with new models from providers?
6. **Additional Capabilities**: Since all models in `Lang.models` already support chat, what additional capabilities are most important to filter by?

## Acceptance Criteria

1. Users can select models based on additional capabilities and context window size
2. The application automatically suggests appropriate models for specific tasks
3. Model selection is consistent across the application
4. All model metadata is sourced from `Lang.models`
5. Backward compatibility is maintained for existing model references

## Conclusion

Integrating the AIModels functionality through direct use of `Lang.models` will provide a more robust and standardized approach to model selection and discovery in Supa. The new `getProviders()` functionality makes it even easier to discover and filter providers with chat-capable models, simplifying our implementation and making it more maintainable. By enhancing the existing UI components rather than creating new ones, we maintain consistency while adding powerful new capabilities. This approach improves the user experience while ensuring a smooth transition from the current implementation. 