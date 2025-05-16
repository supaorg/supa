import {
  exists,
  mkdir,
  readDir,
  readTextFile,
  remove,
  writeTextFile
} from "@tauri-apps/plugin-fs";
import { newMoveVertexOp, newSetVertexPropertyOp, type VertexOperation } from "reptree";
import { migrateFromV0ToV1 } from "./versions/migrateSpace_V0";

/**
 * Detects the current version of a space directory
 * @param spacePath Path to the space directory
 * @returns Version number (0 for legacy, 1 for current, etc.)
 */
export async function detectSpaceVersion(spacePath: string): Promise<number> {
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

/**
 * Checks if a migration is in progress for a space
 * @param spacePath Path to the space directory
 * @param waitForCompletion Whether to wait for the migration to complete
 * @returns Promise that resolves with a boolean indicating if migration is in progress
 */
export async function isMigrationInProgress(spacePath: string, waitForCompletion = false): Promise<boolean> {
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
export async function acquireMigrationLock(spacePath: string, fromVersion: number, toVersion: number): Promise<() => Promise<void>> {
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
        await remove(lockFilePath);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('Error removing lock file:', error.message);
        } else {
          console.error('Error removing lock file:', error);
        }
      }
    }
  };
}

/**
 * Checks if a space needs migration and performs migration if needed
 * @param spacePath Path to the space directory
 * @param waitForMigration Whether to wait for an in-progress migration to complete
 * @returns Promise that resolves when migration is complete or not needed
 */
export async function migrateSpaceIfNeeded(spacePath: string, waitForMigration = false): Promise<void> {
  // Check if migration is in progress
  const migrationInProgress = await isMigrationInProgress(spacePath, waitForMigration);
  
  if (migrationInProgress) {
    throw new Error(
      'Migration in progress. Please try again later or set waitForMigration=true to wait for it to complete.'
    );
  }
  
  // Check if space has been migrated but the app was closed before loading the new version
  if (await exists(`${spacePath}/migrated.json`)) {
    try {
      const migratedContent = await readTextFile(`${spacePath}/migrated.json`);
      const migratedData = JSON.parse(migratedContent);
      
      console.log(`Found migrated space: ${migratedData.fromVersion} -> ${migratedData.toVersion}`);
      
      // Check if the migration was completed successfully
      if (migratedData.status === 'completed') {
        // Migration already completed
        return;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error reading migrated.json:', error.message);
      } else {
        console.error('Error reading migrated.json:', error);
      }
      // Continue with normal migration process
    }
  }
  
  // Detect space version
  let currentVersion;
  try {
    currentVersion = await detectSpaceVersion(spacePath);
  } catch (error: unknown) {
    // If we can't detect the version, it's not a valid space
    if (error instanceof Error) {
      throw new Error(`Invalid space structure: ${error.message}`);
    }
    throw new Error('Invalid space structure');
  }
  
  // If not the latest version, migrate
  const latestVersion = 1; // Update this as new versions are added
  if (currentVersion < latestVersion) {
    await migrateSpace(currentVersion, latestVersion, spacePath);
  }
}

/**
 * Migrates a space from one version to another
 * @param fromVersion Current version
 * @param toVersion Target version
 * @param spacePath Path to the space directory
 * @param forceOverrideLock Whether to force migration even if a lock exists
 * @returns Promise that resolves when migration is complete
 */
async function migrateSpace(fromVersion: number, toVersion: number, spacePath: string, forceOverrideLock = false): Promise<void> {
  // No migration needed if already at target version
  if (fromVersion === toVersion) {
    return;
  }
  
  // Ensure we're not trying to downgrade
  if (fromVersion > toVersion) {
    throw new Error(`Cannot downgrade space from v${fromVersion} to v${toVersion}`);
  }
  
  // Check if migration is already in progress
  if (!forceOverrideLock && await isMigrationInProgress(spacePath)) {
    throw new Error('Migration already in progress. Please wait for it to complete or use forceOverrideLock to override.');
  }
  
  // Acquire migration lock
  const releaseLock = await acquireMigrationLock(spacePath, fromVersion, toVersion);
  
  try {
    // Perform migrations sequentially
    for (let v = fromVersion; v < toVersion; v++) {
      await migrateToNextVersion(spacePath, v);
    }
  } finally {
    // Release the lock
    await releaseLock();
  }
}

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

/**
 * Loads operations from a JSONL file
 * @param filePath Path to the JSONL file
 * @param peerId ID of the peer
 * @returns Array of operations
 */
export async function loadOpsFromJSONLFile(filePath: string, peerId: string): Promise<VertexOperation[]> {
  try {
    const content = await readTextFile(filePath);
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    const ops: VertexOperation[] = [];
    
    for (const line of lines) {
      try {
        const [type, counter, targetId, parentIdOrKey, value] = JSON.parse(line);
        
        if (type === 'm') {
          ops.push(newMoveVertexOp(counter, peerId, targetId, parentIdOrKey));
        } else if (type === 'p') {
          ops.push(newSetVertexPropertyOp(counter, peerId, targetId, parentIdOrKey, value));
        }
      } catch (parseError) {
        console.error(`Error parsing operation line: ${line}`, parseError);
      }
    }
    
    return ops;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error loading ops from file ${filePath}:`, error.message);
    } else {
      console.error(`Error loading ops from file ${filePath}:`, error);
    }
    return [];
  }
}

/**
 * Moves a file from source to destination
 * @param sourcePath Source file path
 * @param destPath Destination file path
 */
export async function moveFile(sourcePath: string, destPath: string): Promise<void> {
  const content = await readTextFile(sourcePath);
  await writeTextFile(destPath, content);
  await remove(sourcePath);
}

/**
 * Moves a directory from source to destination
 * @param sourcePath Source directory path
 * @param destPath Destination directory path
 */
export async function moveDirectory(sourcePath: string, destPath: string): Promise<void> {
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
  await remove(sourcePath);
}


