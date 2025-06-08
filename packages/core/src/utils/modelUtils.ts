/**
 * Utility functions for working with model names and provider IDs
 */

/**
 * Splits a model string into provider ID and model ID
 * Handles cases where the model ID itself may contain slashes
 * 
 * @param modelString The full model string in the format "providerId/modelId"
 * @returns An object with providerId and modelId, or null if invalid format
 */
export function splitModelString(modelString: string): { providerId: string; modelId: string } | null {
  if (!modelString || typeof modelString !== 'string') {
    return null;
  }
  
  const firstSlashIndex = modelString.indexOf('/');
  if (firstSlashIndex === -1) {
    return null;
  }
  
  const providerId = modelString.substring(0, firstSlashIndex);
  const modelId = modelString.substring(firstSlashIndex + 1);
  
  if (!providerId || !modelId) {
    return null;
  }
  
  return { providerId, modelId };
}

/**
 * Combines a provider ID and model ID into a full model string
 * 
 * @param providerId The provider ID
 * @param modelId The model ID (can contain slashes)
 * @returns The combined model string in the format "providerId/modelId"
 */
export function combineModelString(providerId: string, modelId: string): string {
  if (!providerId || !modelId) {
    throw new Error('Provider ID and model ID are required');
  }
  
  return `${providerId}/${modelId}`;
}

/**
 * Validates if a string is a valid model string format
 * 
 * @param modelString The string to validate
 * @returns True if the string is in valid "providerId/modelId" format
 */
export function isValidModelString(modelString: string): boolean {
  return splitModelString(modelString) !== null;
}

/**
 * Gets the provider ID from a model string
 * 
 * @param modelString The full model string
 * @returns The provider ID or null if invalid
 */
export function getProviderId(modelString: string): string | null {
  const split = splitModelString(modelString);
  return split ? split.providerId : null;
}

/**
 * Gets the model ID from a model string
 * 
 * @param modelString The full model string
 * @returns The model ID or null if invalid
 */
export function getModelId(modelString: string): string | null {
  const split = splitModelString(modelString);
  return split ? split.modelId : null;
} 