import {
  exists,
  readTextFile,
  remove,
  writeTextFile
} from "@tauri-apps/plugin-fs";
import { type VertexOperation } from "reptree";
import { migrateFromV0ToV1 } from "./versions/migrateSpace_V0";
import { turnJSONLinesIntoOps } from "../LocalSpaceSync";

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
  
  // Wait for migration to complete
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

export interface MigrationStatus {
  /** Current migration step description */
  step: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Optional details about the current step */
  details?: string;
  /** True if migration is complete */
  isComplete: boolean;
  /** Error message if migration failed */
  error?: string;
  /** Current version being migrated from */
  fromVersion?: number;
  /** Target version being migrated to */
  toVersion?: number;
}

type MigrationProgressCallback = (step: string, progress: number, details?: string) => void;
type MigrationStatusCallback = (status: MigrationStatus) => void;

/**
 * Checks if a space needs migration and performs migration if needed
 * @param spacePath Path to the space directory
 * @param statusCallback Optional callback to receive migration status updates
 * @returns Promise that resolves when migration is complete or not needed
 */
export async function migrateSpaceIfNeeded(
  spacePath: string, 
  statusCallback: MigrationStatusCallback = () => {}
): Promise<void> {
  const reportStatus = (status: Omit<MigrationStatus, 'isComplete'>) => {
    statusCallback({
      ...status,
      isComplete: status.progress >= 100 || !!status.error
    });
  };

  // Check if migration is in progress
  reportStatus({
    step: 'Checking for existing migrations',
    progress: 5
  });
  
  const migrationInProgress = await isMigrationInProgress(spacePath, false);
  
  if (migrationInProgress) {
    const errorMsg = 'Migration is already in progress. Please wait for it to complete.';
    reportStatus({
      step: 'Error',
      progress: 100,
      error: errorMsg
    });
    throw new Error(errorMsg);
  }
  
  // Check if space has been migrated but the app was closed before loading the new version
  reportStatus({
    step: 'Checking for previous migration state',
    progress: 10
  });
  
  if (await exists(`${spacePath}/migrated.json`)) {
    try {
      const migratedContent = await readTextFile(`${spacePath}/migrated.json`);
      const migratedData = JSON.parse(migratedContent);
      
      console.log(`Found migrated space: ${migratedData.fromVersion} -> ${migratedData.toVersion}`);
      
      // Check if the migration was completed successfully
      if (migratedData.status === 'completed') {
        reportStatus({
          step: 'Migration already completed',
          progress: 100,
          fromVersion: migratedData.fromVersion,
          toVersion: migratedData.toVersion
        });
        return;
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error reading migrated.json:', errorMsg);
      reportStatus({
        step: 'Error reading migration state',
        progress: 15,
        details: 'Will attempt to continue with migration',
        error: errorMsg
      });
      // Continue with normal migration process
    }
  }
  
  // Detect space version
  reportStatus({
    step: 'Detecting space version',
    progress: 20
  });
  
  let currentVersion;
  try {
    currentVersion = await detectSpaceVersion(spacePath);
    reportStatus({
      step: `Detected space version ${currentVersion}`,
      progress: 25,
      fromVersion: currentVersion
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    reportStatus({
      step: 'Error detecting space version',
      progress: 25,
      error: `Invalid space structure: ${errorMsg}`
    });
    throw new Error(`Invalid space structure: ${errorMsg}`);
  }
  
  // If not the latest version, migrate
  const latestVersion = 1; // Update this as new versions are added
  if (currentVersion < latestVersion) {
    reportStatus({
      step: `Starting migration from v${currentVersion} to v${latestVersion}`,
      progress: 30,
      fromVersion: currentVersion,
      toVersion: latestVersion
    });
    
    await migrateSpace(currentVersion, latestVersion, spacePath, false, (step, progress, details) => {
      // Calculate overall progress (30-90% of total)
      const overallProgress = 30 + (progress * 0.6);
      reportStatus({
        step: `Migrating: ${step}`,
        progress: Math.floor(overallProgress),
        details,
        fromVersion: currentVersion,
        toVersion: latestVersion
      });
    });
    
    reportStatus({
      step: 'Migration completed successfully',
      progress: 100,
      fromVersion: currentVersion,
      toVersion: latestVersion
    });
  } else {
    reportStatus({
      step: 'Space is up to date',
      progress: 100,
      fromVersion: currentVersion,
      toVersion: latestVersion
    });
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
async function migrateSpace(
  fromVersion: number, 
  toVersion: number, 
  spacePath: string, 
  forceOverrideLock = false,
  progressCallback?: MigrationProgressCallback
): Promise<void> {
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
  
  const totalSteps = toVersion - fromVersion;
  
  try {
    // Perform migrations sequentially
    for (let i = 0; i < totalSteps; i++) {
      const currentVersion = fromVersion + i;
      const progress = (i / totalSteps) * 100;
      
      progressCallback?.(`Migrating from v${currentVersion} to v${currentVersion + 1}`, progress);
      await migrateToNextVersion(spacePath, currentVersion, (step: string, stepProgress: number, details?: string) => {
        // Calculate progress within current version step
        const stepStart = (i / totalSteps) * 100;
        const stepEnd = ((i + 1) / totalSteps) * 100;
        const overallProgress = stepStart + (stepProgress * (stepEnd - stepStart) / 100);
        
        progressCallback?.(
          `Migrating to v${currentVersion + 1}: ${step}`, 
          overallProgress,
          details
        );
      });
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
 * @param progressCallback Optional callback for progress updates
 */
async function migrateToNextVersion(
  spacePath: string, 
  fromVersion: number,
  progressCallback?: MigrationProgressCallback
): Promise<void> {
  progressCallback?.('Starting migration', 0);
  
  try {
    switch (fromVersion) {
      case 0: {
        progressCallback?.('Migrating from v0 to v1', 10);
        await migrateFromV0ToV1(spacePath, {
          onProgress: (progress: number, message: string) => {
            // Scale progress to 10-90% for v0->v1 migration
            const scaledProgress = 10 + (progress * 0.8);
            progressCallback?.(`v0→v1: ${message}`, scaledProgress);
          }
        });
        progressCallback?.('Migration to v1 complete', 100);
        break;
      }
      // Add cases for future versions
      default: {
        const errorMsg = `No migration path defined from v${fromVersion} to v${fromVersion + 1}`;
        progressCallback?.(errorMsg, 100, 'Migration failed');
        throw new Error(errorMsg);
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error during migration';
    progressCallback?.(`Migration failed: ${errorMsg}`, 100, 'Migration failed');
    throw error;
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
    
    const ops: VertexOperation[] = await turnJSONLinesIntoOps(lines, peerId);
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


