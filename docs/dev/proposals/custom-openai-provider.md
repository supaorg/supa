# Custom OpenAI-like Provider Specification

## Overview

This specification outlines the implementation of a feature that allows users to add custom OpenAI-compatible API providers to Supa. Unlike the current hardcoded provider list, users will be able to create, configure, and delete custom provider instances that follow the OpenAI API specification.

## Goals

- Allow users to add multiple custom OpenAI-compatible providers (e.g., self-hosted instances, alternative commercial providers)
- Support configuration of endpoint URL, API key, default model ID, and name for each custom provider
- Support custom HTTP headers for providers requiring different authentication methods
- Enable deletion of custom providers through the existing disconnect functionality
- Ensure custom providers are saved between sessions
- Maintain backward compatibility with existing provider functionality

## Non-Goals

- Supporting non-OpenAI-compatible API formats (only OpenAI-compatible APIs for this implementation)
- Creating a separate management UI beyond the existing provider selection screen
- Modifying the core provider API validation logic
- Custom icon upload or selection (may be added in future)
- Model discovery for custom providers (will use user-specified model ID only)

## User Experience

1. The user navigates to Model Providers screen
2. A new "Add Custom OpenAI-compatible API" card appears in the grid
3. Clicking this card opens a configuration form with:
   - Name field (for user-defined provider name)
   - API URL field (defaulting to https://api.example.com/v1)
   - API Key field
   - Model ID field (exact model ID to use with this provider)
   - Custom Headers field (key-value pairs for additional HTTP headers)
4. Upon saving, the custom provider appears in the grid alongside built-in providers
5. Multiple custom providers can be created with different configurations
6. Custom providers can be disconnected/deleted using the existing disconnect functionality
7. Custom providers are usable in the model selection dropdown, showing only the user-specified model

## Technical Implementation

### 1. AIWrapper Dependency Update

First, update the AIWrapper dependency to version 0.1.6 or later to utilize the new `Lang.openaiLike` constructor, which simplifies integration with OpenAI-compatible APIs:

```json
// In package.json
"dependencies": {
  "aiwrapper": "^0.1.6"
}
```

### 2. Model Provider Data Structure Updates

The `ModelProvider` type will need minor updates to distinguish between built-in and custom providers:

```typescript
export type ModelProvider = {
  id: string;
  name: string;
  access: ModelProviderAccessType;
  url: string;
  logoUrl: string;
  defaultModel?: string;
  isCustom?: boolean;
  baseApiUrl?: string; // For custom OpenAI-compatible providers
};
```

### 3. Provider Storage

Custom providers will be stored in the space configuration alongside other model provider configurations:

```typescript
export type CustomProviderConfig = ModelProviderCloudConfig & {
  name: string;
  baseApiUrl: string;
  modelId: string; // Required model ID for this provider
  customHeaders?: Record<string, string>;
};
```

We'll add methods to Space class to manage custom providers:
- `addCustomProvider(config: CustomProviderConfig): string` - Returns new provider ID
- `updateCustomProvider(id: string, config: Partial<CustomProviderConfig>): void`
- `removeCustomProvider(id: string): void`
- `getCustomProviders(): CustomProviderConfig[]`

### 4. Provider Registration

We'll modify the provider loading logic to combine built-in providers with user-defined custom providers:

```typescript
// In a new file: packages/core/src/customProviders.ts
export function getActiveProviders(): ModelProvider[] {
  const builtInProviders = [...providers]; // From static list
  const customProviders = currentSpace?.getCustomProviders() || [];
  
  // Transform custom configs to ModelProvider format
  const customProviderModels = customProviders.map(config => ({
    id: config.id,
    name: config.name,
    access: "cloud" as ModelProviderAccessType,
    url: config.baseApiUrl,
    logoUrl: "/providers/openai-like.png", // Custom icon for OpenAI-compatible providers
    defaultModel: config.modelId, // Use the user-specified model ID
    isCustom: true,
    baseApiUrl: config.baseApiUrl
  }));
  
  return [...builtInProviders, ...customProviderModels];
}
```

### 5. UI Changes

Update `ModelProviders.svelte` to include:
1. An "Add Custom Provider" card (using the openai-like.png icon)
2. A form dialog for custom provider configuration with fields for:
   - Provider name
   - Base API URL 
   - API Key
   - Model ID (required)
   - Custom Headers (key-value editor)
3. Enhanced provider card to show custom provider details and deletion option

### 6. Model Selection for Custom Providers

Since we're not fetching available models for custom providers, we'll need to modify the model selection logic:

```typescript
// In packages/core/src/tools/providerModels.ts
export function getProviderModels(
  provider: string,
  key: string,
  signal?: AbortSignal,
): Promise<string[]> {
  // For cloud providers, try to use Lang.models if available
  if (provider !== "ollama") {
    try {
      // Check if Lang.models is available
      if (Lang.models) {
        const models = Lang.models.fromProvider(provider);
        
        if (models && models.length > 0) {
          return Promise.resolve(models.map(model => model.id));
        }
      }
    } catch (error) {
      console.warn(`Error getting models from provider ${provider}:`, error);
      // Continue to fallback implementation
    }
  }
  
  // Check if this is a custom provider
  const customProvider = currentSpace?.getCustomProviders()
    .find(p => p.id === provider);
    
  if (customProvider) {
    // For custom providers, just return the configured model ID
    return Promise.resolve([customProvider.modelId]);
  }
  
  // Legacy implementation as fallback for built-in providers
  switch (provider) {
    case "openai":
      return getProviderModels_openai(key, signal);
    // ... other provider cases
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
```

### 7. Integration with AIWrapper

When creating a client for chat or inference with a custom provider, use `Lang.openaiLike`:

```typescript
// Example of how this will work with AIWrapper
function createClientForProvider(providerId: string, apiKey: string) {
  const customProvider = currentSpace?.getCustomProviders()
    .find(p => p.id === providerId);
    
  if (customProvider) {
    return new Lang.openaiLike({
      apiKey,
      baseURL: customProvider.baseApiUrl,
      headers: customProvider.customHeaders,
      defaultModel: customProvider.modelId, // Use the specified model ID
    });
  }
  
  // Regular provider logic...
  switch (providerId) {
    case "openai":
      return new Lang.OpenAI({ apiKey });
    // ... other provider cases
  }
}
```

## Implementation Plan

1. Update the AIWrapper dependency to version 0.1.6 or later
2. Update data models in `models.ts` to support custom providers
3. Implement custom provider storage in Space class
4. Create the provider registration logic to combine built-in and custom providers
5. Update the UI components:
   - Add "Add Custom Provider" card to ModelProviders.svelte
   - Create a form dialog for custom provider configuration
   - Add form fields for name, URL, API key, model ID, and custom headers
   - Enhance provider card to handle custom providers
6. Update the model selection logic to use the user-specified model ID
7. Add validation for custom provider configurations
8. Update model selection dropdown to display custom providers
9. Implement disconnect/deletion functionality for custom providers
10. Ensure compatibility with the existing provider system
11. Add "openai-like.png" icon to the assets directory

## User Documentation

Brief documentation will be added explaining:
- What custom OpenAI-compatible providers are
- How to configure various common self-hosted models (e.g., LocalAI, Ollama with OpenAI compat)
- Configuration requirements (endpoint URL format, API key, headers)
- Finding the correct model ID for different OpenAI-compatible solutions
- Troubleshooting steps for connection issues
- Examples of common model IDs for popular self-hosted models

## Future Enhancements

Potential future improvements (not part of initial implementation):
- Custom icon upload or selection for individual custom providers
- Support for other API formats beyond OpenAI-compatible
- Advanced configuration options (e.g., timeouts, rate limits)
- Model discovery to automatically fetch available models from the API
- Provider templates for common self-hosted solutions 