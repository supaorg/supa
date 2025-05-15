import {
  exists,
  mkdir,
  readDir,
  readTextFile,
  remove,
  writeTextFile,
  type FileHandle
} from "@tauri-apps/plugin-fs";
import Space from "@core/spaces/Space";
import { RepTree, newMoveVertexOp, newSetVertexPropertyOp, type VertexOperation } from "reptree";
import uuid from "@core/uuid/uuid";

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
 * Migrates a space from one version to another
 * @param spacePath Path to the space directory
 * @param targetVersion Version to migrate to (defaults to latest)
 * @param forceOverrideLock Whether to force migration even if a lock exists
 * @returns Promise that resolves when migration is complete
 */
export async function migrateSpace(spacePath: string, targetVersion?: number, forceOverrideLock = false): Promise<void> {
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
    // Perform migrations sequentially
    for (let v = currentVersion; v < version; v++) {
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
    await remove(tempDirPath, { recursive: true });
    
    console.log(`Migration from v0 to v1 completed for space at ${spacePath}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Migration failed: ${error.message}`);
      throw error;
    } else {
      console.error(`Migration failed:`, error);
      throw new Error(`Migration failed due to an unknown error`);
    }
  }
}

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

/**
 * Loads all operations for a tree from the filesystem
 * @param spacePath Path to the space directory
 * @param treeId ID of the tree
 * @param isLegacy Whether to use legacy (v0) format
 * @returns Array of operations
 */
export async function loadAllTreeOps(spacePath: string, treeId: string, isLegacy = false): Promise<VertexOperation[]> {
  // Determine the base path based on version
  const basePath = isLegacy ? spacePath : `${spacePath}/space-v1`;
  
  // Get the tree ID prefix and suffix
  const prefix = treeId.substring(0, 2);
  const suffix = treeId.substring(2);
  
  const treeOpsPath = `${basePath}/ops/${prefix}/${suffix}`;
  
  // Check if directory exists
  if (!await exists(treeOpsPath)) {
    return [];
  }
  
  const allOps: VertexOperation[] = [];
  
  if (isLegacy) {
    // Legacy format: YYYY-MM-DD directories
    const dateDirs = await readDir(treeOpsPath);
    
    for (const dateDir of dateDirs) {
      if (dateDir.isDirectory && dateDir.name.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const datePath = `${treeOpsPath}/${dateDir.name}`;
        const peerFiles = await readDir(datePath);
        
        for (const peerFile of peerFiles) {
          if (peerFile.isFile && peerFile.name.endsWith('.jsonl')) {
            const filePath = `${datePath}/${peerFile.name}`;
            const ops = await loadOpsFromFile(filePath, peerFile.name.split('.')[0]);
            allOps.push(...ops);
          }
        }
      }
    }
  } else {
    // New format: YYYY/MM/DD directories
    const yearDirs = await readDir(treeOpsPath);
    
    for (const yearDir of yearDirs) {
      if (yearDir.isDirectory && yearDir.name.match(/^\d{4}$/)) {
        const yearPath = `${treeOpsPath}/${yearDir.name}`;
        const monthDirs = await readDir(yearPath);
        
        for (const monthDir of monthDirs) {
          if (monthDir.isDirectory && monthDir.name.match(/^\d{2}$/)) {
            const monthPath = `${yearPath}/${monthDir.name}`;
            const dayDirs = await readDir(monthPath);
            
            for (const dayDir of dayDirs) {
              if (dayDir.isDirectory && dayDir.name.match(/^\d{2}$/)) {
                const dayPath = `${monthPath}/${dayDir.name}`;
                const peerFiles = await readDir(dayPath);
                
                for (const peerFile of peerFiles) {
                  if (peerFile.isFile && peerFile.name.endsWith('.jsonl')) {
                    const filePath = `${dayPath}/${peerFile.name}`;
                    const ops = await loadOpsFromFile(filePath, peerFile.name.split('.')[0]);
                    allOps.push(...ops);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  return allOps;
}

/**
 * Loads operations from a JSONL file
 * @param filePath Path to the JSONL file
 * @param peerId ID of the peer
 * @returns Array of operations
 */
async function loadOpsFromFile(filePath: string, peerId: string): Promise<VertexOperation[]> {
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
async function moveFile(sourcePath: string, destPath: string): Promise<void> {
  const content = await readTextFile(sourcePath);
  await writeTextFile(destPath, content);
  await remove(sourcePath);
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
  await remove(sourcePath);
}

/**
 * Loads a space from a specific version path
 * @param basePath Base path to the space directory
 * @param version Version of the space to load
 * @returns Promise that resolves with the loaded Space
 */
export async function loadSpaceFromVersion(basePath: string, version: number): Promise<Space> {
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
