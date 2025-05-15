# Local Space Migrations Specification

## Current Space Structure Overview

Supa has recently updated its space storage structure to use a versioned approach. The current implementation (v1) stores spaces in the following structure:

```
/space-directory/
  README.md            # Brief description of what a Supa space is and warnings about not modifying
  space-v1/            # Version-specific directory
    space.json         # Contains space metadata (ID)
    secrets            # Encrypted space secrets
    ops/               # Operations directory
      xx/              # First 2 chars of tree ID
        xxxxxxxxxx/    # Rest of tree ID
          YYYY/        # Year (UTC)
            MM/        # Month (UTC)
              DD/      # Day (UTC)
                peerId.jsonl # Operations file for a specific peer
```

## Legacy Space Structure (v0)

The legacy structure (v0) stored spaces differently:

```
/space-directory/
  space.json           # Contains space metadata (ID)
  secrets              # Encrypted space secrets
  ops/                 # Operations directory
    xx/                # First 2 chars of tree ID
      xxxxxxxxxx/      # Rest of tree ID
        YYYY-MM-DD/    # Date directory (local timezone)
          peerId.jsonl # Operations file for a specific peer
```

Key differences in v0:
1. No versioned directory structure (`space-v1/`)
2. No README.md with warnings
3. Date format used YYYY-MM-DD instead of YYYY/MM/DD
4. Dates were stored in local timezone instead of UTC

## Migration System Design

### 1. Version Detection

We need a system to detect the version of a space directory:

```typescript
/**
 * Detects the current version of a space directory
 * @param spacePath Path to the space directory
 * @returns Version number (0 for legacy, 1 for current, etc.)
 */
async function detectSpaceVersion(spacePath: string): Promise<number> {
  // Check for v1 structure
  if (await exists(`${spacePath}/space-v1`)) {
    return 1;
  }
  
  // Check for v0 structure (legacy)
  if (await exists(`${spacePath}/space.json`) && await exists(`${spacePath}/ops`)) {
    return 0;
  }
  
  // Unknown structure
  throw new Error("Unknown space structure: not a valid Supa space directory");
}
```

### 2. Migration Pipeline

We'll implement a migration pipeline that can handle migrations between any versions, with a robust locking mechanism:

```typescript
/**
 * Checks if a migration is in progress for a space
 * @param spacePath Path to the space directory
 * @param waitForCompletion Whether to wait for the migration to complete
 * @returns Promise that resolves with a boolean indicating if migration is in progress
 */
async function isMigrationInProgress(spacePath: string, waitForCompletion = false): Promise<boolean> {
  const lockFilePath = `${spacePath}/migration.lock`;
  
  if (!await exists(lockFilePath)) {
    return false;
  }
  
  // Read lock file to check when migration started and when it was last updated
  const lockContent = await readTextFile(lockFilePath);
  let lockData;
  
  try {
    lockData = JSON.parse(lockContent);
  } catch (error) {
    console.error('Invalid lock file format, treating as stale');
    return false;
  }
  
  const startTime = new Date(lockData.startTime);
  const lastUpdateTime = lockData.lastUpdateTime ? new Date(lockData.lastUpdateTime) : startTime;
  const currentTime = new Date();
  
  // If lock was last updated more than 60 seconds ago, assume it's stale
  const staleLockThresholdMs = 60 * 1000; // 60 seconds
  if (currentTime.getTime() - lastUpdateTime.getTime() > staleLockThresholdMs) {
    console.log(`Found stale migration lock from ${startTime.toISOString()}, treating as abandoned`);
    return false;
  }
  
  if (!waitForCompletion) {
    return true;
  }
  
  // Wait for migration to complete or become stale
  console.log('Waiting for migration to complete...');
  
  return new Promise((resolve) => {
    const checkInterval = setInterval(async () => {
      if (!await exists(lockFilePath)) {
        // Lock file was removed, migration completed
        clearInterval(checkInterval);
        resolve(false);
        return;
      }
      
      try {
        const updatedLockContent = await readTextFile(lockFilePath);
        const updatedLockData = JSON.parse(updatedLockContent);
        const updatedLastUpdateTime = updatedLockData.lastUpdateTime 
          ? new Date(updatedLockData.lastUpdateTime) 
          : new Date(updatedLockData.startTime);
        const newCurrentTime = new Date();
        
        if (newCurrentTime.getTime() - updatedLastUpdateTime.getTime() > staleLockThresholdMs) {
          // Lock is stale
          clearInterval(checkInterval);
          resolve(false);
        }
      } catch (error) {
        // Error reading lock file, assume it's gone or corrupted
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 1000); // Check every second
  });
}

/**
 * Creates a migration lock file and sets up a background process to update it
 * @param spacePath Path to the space directory
 * @param fromVersion Current version
 * @param toVersion Target version
 * @returns Function to release the lock
 */
async function acquireMigrationLock(spacePath: string, fromVersion: number, toVersion: number): Promise<() => Promise<void>> {
  const lockFilePath = `${spacePath}/migration.lock`;
  
  // Create and write to lock file
  const lockData = {
    startTime: new Date().toISOString(),
    lastUpdateTime: new Date().toISOString(),
    version: {
      from: fromVersion,
      to: toVersion
    }
  };
  
  await writeTextFile(lockFilePath, JSON.stringify(lockData));
  
  // Set up background process to update the lock file every 10 seconds
  let intervalId: number | null = null;
  
  const updateLock = async () => {
    if (await exists(lockFilePath)) {
      try {
        const existingLockContent = await readTextFile(lockFilePath);
        const existingLockData = JSON.parse(existingLockContent);
        
        // Update only the lastUpdateTime field
        existingLockData.lastUpdateTime = new Date().toISOString();
        
        await writeTextFile(lockFilePath, JSON.stringify(existingLockData));
      } catch (error) {
        console.error('Error updating lock file:', error);
      }
    } else {
      // Lock file was removed externally, stop updating
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
  };
  
  intervalId = setInterval(updateLock, 10000) as unknown as number; // Update every 10 seconds
  
  // Return a function to release the lock
  return async () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    
    if (await exists(lockFilePath)) {
      try {
        await removeFile(lockFilePath);
      } catch (error) {
        console.error('Error removing lock file:', error);
      }
    }
  };
}

/**
 * Migrates a space from one version to another
 * @param spacePath Path to the space directory
 * @param targetVersion Version to migrate to (defaults to latest)
 * @param forceOverrideLock Whether to force migration even if a lock exists
 * @returns Promise that resolves when migration is complete
 */
async function migrateSpace(spacePath: string, targetVersion?: number, forceOverrideLock = false): Promise<void> {
  // Determine current version
  const currentVersion = await detectSpaceVersion(spacePath);
  
  // Determine target version (default to latest)
  const latestVersion = 1; // Update this as new versions are added
  const version = targetVersion || latestVersion;
  
  // No migration needed if already at target version
  if (currentVersion === version) {
    return;
  }
  
  // Ensure we're not trying to downgrade
  if (currentVersion > version) {
    throw new Error(`Cannot downgrade space from v${currentVersion} to v${version}`);
  }
  
  // Check if migration is already in progress
  if (!forceOverrideLock && await isMigrationInProgress(spacePath)) {
    throw new Error('Migration already in progress. Please wait for it to complete or use forceOverrideLock to override.');
  }
  
  // Acquire migration lock
  const releaseLock = await acquireMigrationLock(spacePath, currentVersion, version);
  
  try {
    // Register handler for unexpected termination
    const handleTermination = () => {
      // This is a best-effort cleanup, but might not always work depending on how the process is terminated
      releaseLock().catch(console.error);
    };
    
    // Register for common termination signals
    process.on('beforeExit', handleTermination);
    process.on('exit', handleTermination);
    process.on('SIGINT', handleTermination);
    process.on('SIGTERM', handleTermination);
    process.on('uncaughtException', handleTermination);
    
    // Perform migrations sequentially
    for (let v = currentVersion; v < version; v++) {
      await migrateToNextVersion(spacePath, v);
    }
  } finally {
    // Clean up termination handlers
    process.off('beforeExit', handleTermination);
    process.off('exit', handleTermination);
    process.off('SIGINT', handleTermination);
    process.off('SIGTERM', handleTermination);
    process.off('uncaughtException', handleTermination);
    
    // Release the lock
    await releaseLock();
  }
}
```

### 3. Version-Specific Migration Functions

Each version transition will have its own migration function:

```typescript
/**
 * Migrates a space from one version to the next
 * @param spacePath Path to the space directory
 * @param fromVersion Current version to migrate from
 */
async function migrateToNextVersion(spacePath: string, fromVersion: number): Promise<void> {
  switch (fromVersion) {
    case 0:
      await migrateFromV0ToV1(spacePath);
      break;
    // Add cases for future versions
    default:
      throw new Error(`No migration path defined from v${fromVersion} to v${fromVersion + 1}`);
  }
}
```

### 4. V0 to V1 Migration Implementation

The migration from v0 to v1 will:
1. Create the new versioned directory structure in a temporary location
2. Copy and transform the data from the old structure
3. Validate the migration was successful
4. Move the temporary directory to the final location
5. Mark the old structure as migrated
6. Create a README.md file

```typescript
/**
 * Migrates a space from v0 to v1
 * @param spacePath Path to the space directory
 */
async function migrateFromV0ToV1(spacePath: string): Promise<void> {
  console.log(`Migrating space at ${spacePath} from v0 to v1`);
  
  try {
    // Create temporary directory for migration
    const tempDirPath = `${spacePath}/.temp-migration-v1-${Date.now()}`;
    await mkdir(tempDirPath, { recursive: true });
    
    // Create v1 directory structure in temp location
    const tempV1Path = `${tempDirPath}/space-v1`;
    await mkdir(tempV1Path, { recursive: true });
    await mkdir(`${tempV1Path}/ops`, { recursive: true });
    
    // Copy space.json
    const spaceJson = await readTextFile(`${spacePath}/space.json`);
    await writeTextFile(`${tempV1Path}/space.json`, spaceJson);
    
    // Copy secrets if they exist
    if (await exists(`${spacePath}/secrets`)) {
      const secrets = await readTextFile(`${spacePath}/secrets`);
      await writeTextFile(`${tempV1Path}/secrets`, secrets);
    }
    
    // Parse space.json to get the space ID
    const spaceData = JSON.parse(spaceJson);
    const spaceId = spaceData.id;
    
    if (!spaceId) {
      throw new Error("Space ID not found in space.json");
    }
    
    // Migrate operations
    await migrateOperations(spacePath, tempV1Path, spaceId);
    
    // Create README.md
    await writeTextFile(`${tempDirPath}/README.md`, 
      `# Supa Space\n\nThis directory contains a Supa space. Please do not rename or modify the 'space-v1' directory structure as it will corrupt your data.`);
    
    // Validate migration
    await validateMigration(spacePath, tempDirPath, spaceId);
    
    // Move the temporary files to the final location
    // First, move the space-v1 directory
    await moveDirectory(`${tempDirPath}/space-v1`, `${spacePath}/space-v1`);
    
    // Then move the README.md
    if (await exists(`${tempDirPath}/README.md`)) {
      await moveFile(`${tempDirPath}/README.md`, `${spacePath}/README.md`);
    }
    
    // Mark the old structure as migrated
    await writeTextFile(`${spacePath}/migrated.json`, JSON.stringify({
      migratedAt: new Date().toISOString(),
      fromVersion: 0,
      toVersion: 1,
      status: "completed"
    }));
    
    // Create migration log
    await writeTextFile(`${spacePath}/migration-v0-to-v1.log`, 
      `Migration from v0 to v1 completed at ${new Date().toISOString()}\n` +
      `Original v0 data preserved in root directory for reference.`);
    
    // Remove the temporary directory
    await removeDir(tempDirPath, { recursive: true });
    
    console.log(`Migration from v0 to v1 completed for space at ${spacePath}`);
  } catch (error) {
    console.error(`Migration failed: ${error.message}`);
    throw error;
  }
}
```

### 5. Helper Functions for Migration

#### Operations Migration

The most complex part is migrating the operations, which involves restructuring the date directories:

```typescript
/**
 * Migrates operations from v0 to v1 format
 * @param oldSpacePath Path to the old space directory
 * @param newSpacePath Path to the new space directory
 * @param spaceId ID of the space
 */
async function migrateOperations(oldSpacePath: string, newSpacePath: string, spaceId: string): Promise<void> {
  // Get the tree ID prefix and suffix
  const prefix = spaceId.substring(0, 2);
  const suffix = spaceId.substring(2);
  
  // Create the tree directory structure
  const oldTreePath = `${oldSpacePath}/ops/${prefix}/${suffix}`;
  const newTreePath = `${newSpacePath}/ops/${prefix}/${suffix}`;
  
  // Check if the old tree path exists
  if (!await exists(oldTreePath)) {
    console.log(`No operations found at ${oldTreePath}`);
    return;
  }
  
  // Create the new tree directory
  await mkdir(newTreePath, { recursive: true });
  
  // Read all date directories in the old format (YYYY-MM-DD)
  const dateDirs = await readDir(oldTreePath);
  
  for (const dateDir of dateDirs) {
    if (dateDir.isDirectory && dateDir.name.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Parse the date
      const [year, month, day] = dateDir.name.split('-');
      
      // Create new directory structure (YYYY/MM/DD)
      const newDatePath = `${newTreePath}/${year}/${month}/${day}`;
      await mkdir(newDatePath, { recursive: true });
      
      // Copy all peer files
      const peerFiles = await readDir(`${oldTreePath}/${dateDir.name}`);
      for (const peerFile of peerFiles) {
        if (peerFile.isFile && peerFile.name.endsWith('.jsonl')) {
          const content = await readTextFile(`${oldTreePath}/${dateDir.name}/${peerFile.name}`);
          await writeTextFile(`${newDatePath}/${peerFile.name}`, content);
        }
      }
    }
  }
}
```

#### Migration Validation

To ensure data integrity during migration, we validate that all operations were correctly migrated:

```typescript
/**
 * Validates that the migration was successful by comparing operation counts and checksums
 * @param oldSpacePath Path to the old space directory
 * @param newSpacePath Path to the new space directory
 * @param spaceId ID of the space
 */
async function validateMigration(oldSpacePath: string, newSpacePath: string, spaceId: string): Promise<void> {
  console.log('Validating migration...');
  
  // Load operations from both old and new structures
  const oldOps = await loadAllTreeOps(oldSpacePath, spaceId, true); // true = legacy format
  const newOps = await loadAllTreeOps(newSpacePath, spaceId, false); // false = new format
  
  // Check operation counts
  if (oldOps.length !== newOps.length) {
    throw new Error(`Migration validation failed: Operation count mismatch. Old: ${oldOps.length}, New: ${newOps.length}`);
  }
  
  // Check operation content (simplified check - in production we'd do more thorough validation)
  const oldOpsJson = JSON.stringify(oldOps.sort((a, b) => a.id.counter - b.id.counter));
  const newOpsJson = JSON.stringify(newOps.sort((a, b) => a.id.counter - b.id.counter));
  
  if (oldOpsJson !== newOpsJson) {
    throw new Error('Migration validation failed: Operation content mismatch');
  }
  
  console.log('Migration validation successful');
}
```

#### File and Directory Operations

Helper functions for moving files and directories:

```typescript
/**
 * Moves a file from source to destination
 * @param sourcePath Source file path
 * @param destPath Destination file path
 */
async function moveFile(sourcePath: string, destPath: string): Promise<void> {
  const content = await readTextFile(sourcePath);
  await writeTextFile(destPath, content);
  await removeFile(sourcePath);
}

/**
 * Moves a directory from source to destination
 * @param sourcePath Source directory path
 * @param destPath Destination directory path
 */
async function moveDirectory(sourcePath: string, destPath: string): Promise<void> {
  // Create destination directory
  await mkdir(destPath, { recursive: true });
  
  // Read all entries in source directory
  const entries = await readDir(sourcePath);
  
  // Move each entry
  for (const entry of entries) {
    const sourceEntryPath = `${sourcePath}/${entry.name}`;
    const destEntryPath = `${destPath}/${entry.name}`;
    
    if (entry.isDirectory) {
      // Recursively move subdirectory
      await moveDirectory(sourceEntryPath, destEntryPath);
    } else {
      // Move file
      await moveFile(sourceEntryPath, destEntryPath);
    }
  }
  
  // Remove source directory after all contents have been moved
  await removeDir(sourcePath);
}
```

## Integration with LocalSpaceSync

To integrate the migration system with the existing LocalSpaceSync, we need to modify the `loadLocalSpace` function:

```typescript
async function loadLocalSpace(path: string, waitForMigration = false): Promise<Space> {
  // Check if migration is in progress
  const migrationInProgress = await isMigrationInProgress(path, waitForMigration);
  
  if (migrationInProgress) {
    throw new Error(
      'Migration in progress. Please try again later or set waitForMigration=true to wait for it to complete.'
    );
  }
  
  // Check if space has been migrated but the app was closed before loading the new version
  if (await exists(`${path}/migrated.json`)) {
    try {
      const migratedContent = await readTextFile(`${path}/migrated.json`);
      const migratedData = JSON.parse(migratedContent);
      
      console.log(`Found migrated space: ${migratedData.fromVersion} -> ${migratedData.toVersion}`);
      
      // Check if the migration was completed successfully
      if (migratedData.status === 'completed') {
        // Use the new version path
        return await loadSpaceFromVersion(path, migratedData.toVersion);
      }
    } catch (error) {
      console.error('Error reading migrated.json:', error);
      // Continue with normal loading process
    }
  }
  
  // Detect space version
  let version;
  try {
    version = await detectSpaceVersion(path);
  } catch (error) {
    throw new Error(`Failed to detect space version: ${error.message}`);
  }
  
  // If not the latest version, migrate
  const latestVersion = 1; // Update this as new versions are added
  if (version < latestVersion) {
    try {
      await migrateSpace(path, latestVersion);
      version = latestVersion;
    } catch (error) {
      throw new Error(`Failed to migrate space: ${error.message}`);
    }
  }
  
  return await loadSpaceFromVersion(path, version);
}

/**
 * Loads a space from a specific version path
 * @param basePath Base path to the space directory
 * @param version Version of the space to load
 * @returns Promise that resolves with the loaded Space
 */
async function loadSpaceFromVersion(basePath: string, version: number): Promise<Space> {
  // Determine the path based on version
  const spacePath = version === 0 ? basePath : `${basePath}/space-v${version}`;
  const spaceJsonPath = `${spacePath}/space.json`;
  
  if (!await exists(spaceJsonPath)) {
    throw new Error(`space.json not found in v${version} structure`);
  }
  
  const spaceJson = await readTextFile(spaceJsonPath);
  
  // Get id from spaceJson
  const spaceData = JSON.parse(spaceJson);
  const spaceId = spaceData.id;
  
  if (!spaceId) {
    throw new Error("Space ID not found in space.json");
  }
  
  // Load space tree 
  const ops = await loadAllTreeOps(basePath, spaceId, version === 0);
  
  if (ops.length === 0) {
    throw new Error("No operations found for space");
  }
  
  return new Space(new RepTree(uuid(), ops));
}
```

## Migration Validation and Safety

To ensure data safety during migration:

1. **Validation**: After migration, validate that all operations were correctly migrated by comparing counts and checksums.

2. **Backup**: Keep the original v0 structure intact until the user confirms the migration was successful.

3. **Rollback**: Provide a mechanism to roll back to the previous version if issues are detected.

4. **Logging**: Create detailed logs of the migration process for debugging.

## Implementation Plan

1. **Phase 1: Version Detection**
   - Implement the `detectSpaceVersion` function
   - Add version detection to `loadLocalSpace`

2. **Phase 2: Migration Framework**
   - Implement the migration pipeline
   - Create the v0 to v1 migration function

3. **Phase 3: Testing**
   - Create test spaces in v0 format
   - Test migration to v1
   - Verify data integrity

4. **Phase 4: Integration**
   - Integrate migration into the main application flow
   - Add user notifications about migration

5. **Phase 5: Cleanup**
   - Add functionality to safely remove old v0 data after successful migration
   - Document the migration process for users

## Future Considerations

1. **Bidirectional Migration**: While not immediately necessary, consider how to handle downgrades for compatibility with older Supa versions.

2. **Performance**: For large spaces, migration could be time-consuming. Consider implementing progress reporting and background processing.

3. **Error Recovery**: Implement robust error handling and recovery mechanisms for interrupted migrations.

4. **User Control**: Provide options for users to control when migrations happen, especially for large spaces.
