# Dynamic AI Models Update Mechanism

## Overview

Supa currently uses AIWrapper (which depends on aimodels) for AI model support. This proposal outlines a simplified approach to dynamically fetch and update aimodels data.

## Current Architecture

1. **Dependency Chain**: 
   - Supa → aiwrapper → aimodels
   - Supa uses aiwrapper v0.1.19
   - aiwrapper uses aimodels v0.4.11

2. **Model Information Access**:
   - Models are accessed through `Lang.models` in AIWrapper
   - `getProviderModels()` tries to use `Lang.models.fromProvider(provider)` or falls back to provider-specific APIs

## Challenge

When new AI models are released, users can't access them until:
1. aimodels updates
2. aiwrapper updates its dependency
3. Supa updates its dependency
4. The user updates Supa

## Implementation Specifications

### 1. New AIModels API for Checking Updates

First, propose a new API in aimodels for checking if newer data is available:

```typescript
// To be added to aimodels package
interface DataUpdateInfo {
  version: string;
  schemaVersion: string; // Format: "major.minor.patch"
  modelsUrl: string;
  providersUrl: string;
  orgsUrl: string;
  lastUpdated: string;
}

// Static method on AIModels class
static async getNewerDataIfAvailable(): Promise<DataUpdateInfo | null> {
  try {
    // Check a known endpoint for metadata about the latest available version
    const response = await fetch('https://cdn.jsdelivr.net/npm/aimodels@latest/data/version.json');
    const versionInfo = await response.json();
    
    // Compare with current version
    if (this.isNewerCompatibleVersion(versionInfo.version, versionInfo.schemaVersion)) {
      return {
        version: versionInfo.version,
        schemaVersion: versionInfo.schemaVersion,
        modelsUrl: versionInfo.modelsUrl || 'https://cdn.jsdelivr.net/npm/aimodels@latest/data/models.json',
        providersUrl: versionInfo.providersUrl || 'https://cdn.jsdelivr.net/npm/aimodels@latest/data/providers.json',
        orgsUrl: versionInfo.orgsUrl || 'https://cdn.jsdelivr.net/npm/aimodels@latest/data/orgs.json',
        lastUpdated: versionInfo.lastUpdated
      };
    }
    
    return null; // No newer version available or incompatible schema
  } catch (error) {
    console.error('Error checking for aimodels updates:', error);
    return null;
  }
}

// Check if the remote version is newer and schema-compatible
static isNewerCompatibleVersion(remoteVersion: string, remoteSchemaVersion: string): boolean {
  // Get current versions
  const currentVersion = this.version;
  const currentSchemaVersion = this.schemaVersion;
  
  // Check if versions are valid
  if (!currentVersion || !remoteVersion || !currentSchemaVersion || !remoteSchemaVersion) {
    return false;
  }
  
  // Parse schema versions into components
  const [currentMajor, currentMinor] = currentSchemaVersion.split('.').map(Number);
  const [remoteMajor, remoteMinor] = remoteSchemaVersion.split('.').map(Number);
  
  // Only allow updates if major and minor versions match
  // This ensures schema compatibility while allowing patch updates
  if (currentMajor !== remoteMajor || currentMinor !== remoteMinor) {
    console.log(`Schema version mismatch: ${currentSchemaVersion} vs ${remoteSchemaVersion}`);
    return false;
  }
  
  // Check if remote version is newer
  return remoteVersion > currentVersion;
}
```

### 2. Supa Implementation to Check and Fetch Updates

```typescript
// src/tools/modelDataUpdater.ts
import { Lang } from 'aiwrapper';

export async function checkAndUpdateModelData() {
  try {
    // @ts-ignore - Access AIModels class through Lang.models
    const AIModels = Lang.models.constructor;
    
    // Skip if the API isn't available
    if (typeof AIModels.getNewerDataIfAvailable !== 'function') {
      console.log('AIModels update API not available');
      return false;
    }
    
    // Check if newer data is available
    const updateInfo = await AIModels.getNewerDataIfAvailable();
    
    if (!updateInfo) {
      console.log('AIModels data is already up to date or incompatible');
      return false;
    }
    
    console.log(`Newer AIModels data available: v${updateInfo.version} (schema: ${updateInfo.schemaVersion})`);
    
    // Fetch the updated data
    const [models, providers, orgs] = await Promise.all([
      fetch(updateInfo.modelsUrl).then(res => res.json()),
      fetch(updateInfo.providersUrl).then(res => res.json()),
      fetch(updateInfo.orgsUrl).then(res => res.json())
    ]);
    
    // Verify data structure before updating
    if (!validateModelData(models, providers, orgs)) {
      console.error('Invalid model data format, aborting update');
      return false;
    }
    
    // Update the data in AIModels
    AIModels.addStaticData({ models, providers, orgs });
    
    console.log(`Successfully updated AIModels data to v${updateInfo.version}`);
    storeUpdateInfo(updateInfo);
    return true;
  } catch (error) {
    console.error('Failed to update AIModels data:', error);
    return false;
  }
}

// Validate data structure to ensure compatibility
function validateModelData(models, providers, orgs) {
  // Basic structure validation
  if (!models || typeof models !== 'object') return false;
  if (!providers || typeof providers !== 'object') return false;
  if (!orgs || typeof orgs !== 'object') return false;
  
  // Sample validation for models
  const sampleModelKey = Object.keys(models)[0];
  if (sampleModelKey) {
    const sampleModel = models[sampleModelKey];
    // Check for required properties
    if (!sampleModel.id || !sampleModel.capabilities || !Array.isArray(sampleModel.capabilities)) {
      return false;
    }
  }
  
  return true;
}

// Store update info in localStorage
function storeUpdateInfo(updateInfo) {
  try {
    localStorage.setItem('supa_aimodels_version', updateInfo.version);
    localStorage.setItem('supa_aimodels_schemaVersion', updateInfo.schemaVersion);
    localStorage.setItem('supa_aimodels_lastUpdated', updateInfo.lastUpdated);
    localStorage.setItem('supa_aimodels_lastChecked', Date.now().toString());
  } catch (error) {
    console.error('Failed to store update info:', error);
  }
}
```

### 3. Integration With Startup Flow

```typescript
// src/app/initialization.ts
import { checkAndUpdateModelData } from '../tools/modelDataUpdater';

export async function initializeApp() {
  // Check for updates in the background
  checkAndUpdateModelData().then(updated => {
    if (updated) {
      console.log('AI models data has been updated!');
      // Optionally notify the user
    }
  });
  
  // Continue with normal startup tasks without waiting
  // ...
  
  console.log('App initialization complete');
}
```

### 4. Handling Edge Cases

```typescript
// src/tools/modelDataUpdater.ts (continued)
export async function checkAndUpdateModelData() {
  // Check if we've checked recently
  if (shouldSkipCheck()) {
    console.log('Skipping AIModels update check (checked recently)');
    return false;
  }
  
  // Implementation as above...
}

function shouldSkipCheck() {
  try {
    const lastChecked = localStorage.getItem('supa_aimodels_lastChecked');
    if (!lastChecked) return false;
    
    // Skip if checked in the last 24 hours
    const checkAge = Date.now() - parseInt(lastChecked);
    return checkAge < 24 * 60 * 60 * 1000;
  } catch (error) {
    return false;
  }
}
```

## Implementation Plan

1. **AIModels Enhancement**:
   - Collaborate with AIModels maintainers to add the `getNewerDataIfAvailable` API
   - Ensure version.json includes schemaVersion for compatibility checking
   - Add semver-based schema version tracking with the following rules:
     - Major: Breaking changes to the data structure
     - Minor: Non-breaking additions to the schema
     - Patch: Data-only updates with no schema changes
   
2. **Supa Implementation**:
   - Implement the update check mechanism with schema verification
   - Add basic caching and throttling to prevent too frequent checks
   - Handle error cases gracefully

3. **User Experience** (optional):
   - Add a UI element to show when models are updated
   - Provide manual refresh option in settings

## Alternative: Package Agnostic Approach

If AIModels cannot be updated to include the new API, implement a standalone version:

```typescript
// src/tools/modelDataChecker.ts
export async function checkForNewerModelData() {
  try {
    // Get current AIModels version and schema version
    const currentVersion = getCurrentAIModelsVersion();
    const currentSchemaVersion = getCurrentAIModelsSchemaVersion();
    
    // If we can't determine current versions, abort
    if (!currentVersion || !currentSchemaVersion) {
      return null;
    }
    
    // Parse current schema version
    const [currentMajor, currentMinor] = currentSchemaVersion.split('.').map(Number);
    
    // Check npm registry for latest version
    const response = await fetch('https://registry.npmjs.org/aimodels/latest');
    const packageInfo = await response.json();
    
    // Check for schema version in packageInfo or fetch from another source
    const schemaVersionResponse = await fetch(`https://cdn.jsdelivr.net/npm/aimodels@${packageInfo.version}/data/version.json`);
    const schemaInfo = await schemaVersionResponse.json();
    const remoteSchemaVersion = schemaInfo.schemaVersion;
    
    // Parse remote schema version
    const [remoteMajor, remoteMinor] = remoteSchemaVersion.split('.').map(Number);
    
    // Only update if major and minor versions match (patch version updates only)
    if (currentMajor === remoteMajor && currentMinor === remoteMinor && packageInfo.version > currentVersion) {
      return {
        version: packageInfo.version,
        schemaVersion: remoteSchemaVersion,
        modelsUrl: `https://cdn.jsdelivr.net/npm/aimodels@${packageInfo.version}/data/models.json`,
        providersUrl: `https://cdn.jsdelivr.net/npm/aimodels@${packageInfo.version}/data/providers.json`,
        orgsUrl: `https://cdn.jsdelivr.net/npm/aimodels@${packageInfo.version}/data/orgs.json`,
        lastUpdated: new Date().toISOString()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error checking for aimodels updates:', error);
    return null;
  }
}

// Implementation to get current versions would need to be adapted
// based on how aimodels exposes this information
```

The solution allows Supa to use the latest AI model data without requiring package updates, improving user experience by providing access to new models immediately upon their release, while ensuring schema compatibility to prevent data corruption. 