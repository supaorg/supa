import { CustomProviderConfig, ModelProvider, ModelProviderAccessType } from "./models";
import { providers } from "./providers";

/**
 * Gets all active providers, including both built-in and custom providers
 * @param customProviders List of custom provider configurations
 * @returns Combined list of built-in and custom providers
 */
export function getActiveProviders(customProviders: CustomProviderConfig[] = []): ModelProvider[] {
  const builtInProviders = [...providers]; // From static list
  
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

/**
 * Generate a unique ID for a new custom provider
 * @param name Provider name
 * @param existingIds List of existing provider IDs to avoid conflicts
 * @returns Unique provider ID
 */
export function generateCustomProviderId(name: string, existingIds: string[] = []): string {
  // Convert name to lowercase and replace spaces with dashes
  const baseId = `custom-${name.toLowerCase().replace(/\s+/g, '-')}`;
  
  // Check if the base ID is already in use
  if (!existingIds.includes(baseId)) {
    return baseId;
  }
  
  // If it's in use, add a number suffix
  let counter = 1;
  let newId = `${baseId}-${counter}`;
  
  while (existingIds.includes(newId)) {
    counter++;
    newId = `${baseId}-${counter}`;
  }
  
  return newId;
} 