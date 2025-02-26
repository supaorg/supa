# AIModels Integration

This document describes the integration of AIWrapper's `Lang.models` functionality into Supa's core model discovery and selection logic.

## Overview

The AIModels integration enhances Supa's ability to discover, filter, and select AI models from various providers. It leverages the `Lang.models` API from the AIWrapper package to provide a more robust and standardized approach to model metadata and capabilities.

## Implementation Details

### Key Files Modified

1. `packages/core/src/tools/providerModels.ts`
   - Updated to use `Lang.models` for cloud providers
   - Implemented safe helper functions to handle potential issues with AIWrapper
   - Maintains legacy implementation as fallback for local providers and error cases

2. `packages/core/src/agents/AgentServices.ts`
   - Enhanced to use `Lang.models` for model selection
   - Updated `getMostCapableModel()` to leverage model metadata from AIWrapper
   - Maintains backward compatibility with legacy implementation

### Key Features

- **Provider Discovery**: Uses `Lang.models.getProviders()` to get a list of available providers
- **Model Discovery**: Uses `Lang.models.fromProvider(provider)` to get models from a specific provider
- **Model Filtering**: Supports filtering models by capabilities and context window size
- **Fallback Mechanism**: Falls back to legacy implementation when AIModels is not available or for local providers
- **Error Handling**: Gracefully handles errors and falls back to legacy implementation

## Testing

We've implemented tests for the AIModels integration using Vitest. The tests are located in the `tests/tools` directory, following the standard project structure.

The tests verify:

1. Basic functionality of model retrieval
2. Error handling and fallback mechanisms
3. Availability of the Lang object

To run the tests:

```bash
cd packages/core
npm test
```

## Implementation Challenges

During implementation, we encountered some challenges:

1. **ESM/CJS Compatibility**: The AIWrapper package uses top-level await, which can cause issues when used in CommonJS environments or with certain bundlers.
2. **Safe Access**: We implemented helper functions to safely check for the availability of `Lang.models` and gracefully handle errors.
3. **Backward Compatibility**: We maintained the legacy implementation as a fallback to ensure the system continues to work even if there are issues with the AIWrapper package.

## Benefits

1. **Standardized Model Metadata**: Consistent model information across providers
2. **Enhanced Filtering**: Filter models by capabilities, context window, etc.
3. **Simplified Code**: Reduces provider-specific code
4. **Future-Proof**: Easier to add new providers and model capabilities

## Future Improvements

1. **Complete Migration**: Fully migrate to AIModels for all providers
2. **Enhanced Model Selection**: Implement more sophisticated model selection based on task requirements
3. **UI Integration**: Expose model capabilities in the UI for better user experience
4. **Local Provider Support**: Extend AIModels to better support local providers like Ollama 