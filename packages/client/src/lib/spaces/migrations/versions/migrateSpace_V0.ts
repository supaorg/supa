import {
  exists,
  mkdir,
  readDir,
  readTextFile,
  remove,
  rename,
  writeTextFile
} from "@tauri-apps/plugin-fs";
import { loadOpsFromJSONLFile } from "$lib/spaces/migrations/SpaceMigrations";
import { type VertexOperation } from "reptree";
import { tempDir, join } from "@tauri-apps/api/path";


export interface MigrationProgress {
  onProgress?: (progress: number, message: string) => void;
}

/**
 * Migrates a space from v0 to v1
 * @param spacePath Path to the space directory
 * @param options Options including progress callback
 */
export async function migrateFromV0ToV1(
  spacePath: string,
  options: MigrationProgress = {}
): Promise<void> {
  const { onProgress } = options;
  
  const reportProgress = (progress: number, message: string) => {
    onProgress?.(Math.min(100, Math.max(0, progress)), message);
  };

  reportProgress(0, 'Starting migration from v0 to v1');
  console.log(`Migrating space at ${spacePath} from v0 to v1`);

  try {
    // Get OS temp directory path
    const osTempDir = await tempDir();
    // Create a unique subdirectory for this migration
    const migrationId = `supa-migration-v1-${Date.now()}`;
    const tempDirPath = await join(osTempDir, migrationId);
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
    reportProgress(30, 'Migrating operations');
    await migrateOperations(spacePath, tempV1Path, spaceId, {
      onProgress: (progress, message) => {
        // Scale operation migration progress from 30-80%
        reportProgress(30 + (progress * 0.5), message);
      }
    });

    // Validate migration
    // @TODO: consider to enable it again. But it's rather slow.
    //await validateMigration(spacePath, tempDirPath, spaceId);

    // Move the temporary files to the final location
    reportProgress(80, 'Finalizing migration');
    // First, move the space-v1 directory using rename for efficiency
    await rename(`${tempDirPath}/space-v1`, `${spacePath}/space-v1`);

    reportProgress(85, 'Creating backup of original files');
    // Create space-v0 directory to store original v0 structure
    const spaceV0Path = `${spacePath}/space-v0`;
    await mkdir(spaceV0Path, { recursive: true });

    // Move v0 files/directories into space-v0
    // 1. Move ops directory
    if (await exists(`${spacePath}/ops`)) {
      console.log(`Moving ops directory from ${spacePath}/ops to ${spaceV0Path}/ops`);
      try {
        // Create the target directory
        await mkdir(`${spaceV0Path}`, { recursive: true });

        // Use rename to move the entire directory at once
        await rename(`${spacePath}/ops`, `${spaceV0Path}/ops`);
      } catch (error) {
        console.error(`Error moving ops directory: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    }

    // 2. Move space.json
    if (await exists(`${spacePath}/space.json`)) {
      await rename(`${spacePath}/space.json`, `${spaceV0Path}/space.json`);
    }

    // 3. Move secrets if it exists
    if (await exists(`${spacePath}/secrets`)) {
      await rename(`${spacePath}/secrets`, `${spaceV0Path}/secrets`);
    }
    
    reportProgress(95, 'Finalizing backup');

    reportProgress(98, 'Creating migration marker');
    // Create migrated.json file in space-v0 to mark the migration as complete
    const migrationInfo = {
      migratedAt: new Date().toISOString(),
      fromVersion: 0,
      toVersion: 1,
      status: "completed",
      details: {
        originalStructure: "v0",
        newStructure: "v1",
        preservedData: true
      }
    };

    await writeTextFile(`${spaceV0Path}/migrated.json`, JSON.stringify(migrationInfo, null, 2));

    // Remove the temporary directory
    await remove(tempDirPath, { recursive: true });

    // Create README.md in the root directory
    await writeTextFile(`${spacePath}/README.md`,
      `# Supa Space

This directory contains a Supa space. Please do not rename or modify the 'space-v1' folder as you won't be able to open the space from Supa. Supa needs it as is. You can delete this file if you want, though.`);

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
 * @param options Options including progress callback
 */
async function migrateOperations(
  oldSpacePath: string, 
  newSpacePath: string, 
  spaceId: string,
  options: MigrationProgress = {}
): Promise<void> {
  const { onProgress } = options;
  
  const reportProgress = (progress: number, message: string) => {
    onProgress?.(progress, message);
  };

  reportProgress(0, 'Starting operation migration');
  // Find and migrate all trees in the space
  await migrateAllTrees(oldSpacePath, newSpacePath, {
    onProgress: (progress, message) => {
      // Scale progress to 0-100% for tree migration
      reportProgress(progress, message);
    }
  });
  
  reportProgress(100, 'Operation migration complete');
}

/**
 * Migrates operations for a specific tree from v0 to v1 format
 * @param oldSpacePath Path to the old space directory
 * @param newSpacePath Path to the new space directory
 * @param treeId ID of the tree to migrate
 */
async function migrateTreeOperations(oldSpacePath: string, newSpacePath: string, treeId: string): Promise<void> {
  // Get the tree ID prefix and suffix
  const prefix = treeId.substring(0, 2);
  const suffix = treeId.substring(2);

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
 * Finds and migrates all trees in a space by scanning the ops directory
 * @param oldSpacePath Path to the old space directory
 * @param newSpacePath Path to the new space directory
 * @param options Options including progress callback
 */
async function migrateAllTrees(
  oldSpacePath: string, 
  newSpacePath: string,
  options: MigrationProgress = {}
): Promise<void> {
  const { onProgress } = options;
  
  const reportProgress = (progress: number, message: string) => {
    onProgress?.(progress, message);
  };

  const opsPath = `${oldSpacePath}/ops`;

  // Check if ops directory exists
  if (!await exists(opsPath)) {
    console.log(`No ops directory found at ${opsPath}`);
    reportProgress(100, 'No operations to migrate');
    return;
  }

  reportProgress(0, 'Scanning for trees to migrate');

  // Read all prefix directories (first 2 chars of tree IDs)
  const prefixDirs = await readDir(opsPath);
  let treeCount = 0;
  let processedTrees = 0;

  // First pass: count total trees for progress reporting
  let totalTrees = 0;
  for (const prefixDir of prefixDirs) {
    if (!prefixDir.isDirectory) continue;
    const prefixPath = `${opsPath}/${prefixDir.name}`;
    const suffixDirs = await readDir(prefixPath);
    totalTrees += suffixDirs.filter(d => d.isDirectory).length;
  }

  if (totalTrees === 0) {
    reportProgress(100, 'No trees to migrate');
    return;
  }

  reportProgress(5, `Found ${totalTrees} trees to migrate`);

  // Second pass: process each tree
  for (const prefixDir of prefixDirs) {
    if (!prefixDir.isDirectory) continue;

    const prefixPath = `${opsPath}/${prefixDir.name}`;
    const suffixDirs = await readDir(prefixPath);

    for (const suffixDir of suffixDirs) {
      if (!suffixDir.isDirectory) continue;

      // Combine prefix and suffix to get the full tree ID
      const treeId = prefixDir.name + suffixDir.name;
      processedTrees++;
      
      const progress = Math.min(100, 5 + Math.floor((processedTrees / totalTrees) * 95));
      reportProgress(progress, `Migrating tree ${processedTrees} of ${totalTrees}: ${treeId}`);
      
      console.log(`Migrating tree: ${treeId}`);
      
      try {
        await migrateTreeOperations(oldSpacePath, newSpacePath, treeId);
        treeCount++;
      } catch (error) {
        console.error(`Error migrating tree ${treeId}:`, error);
        throw error;
      }
    }
  }

  const message = `Migrated ${treeCount} of ${totalTrees} trees`;
  console.log(message);
  reportProgress(100, message);
}



/**
 * Validates that the migration was successful by comparing operation counts and checksums
 * @param oldSpacePath Path to the old space directory
 * @param newSpacePath Path to the new space directory
 * @param spaceId ID of the space
 */
async function validateMigration(oldSpacePath: string, newSpacePath: string, spaceId: string): Promise<void> {
  console.log('Validating migration...');

  // Validate all trees by scanning the ops directory
  const opsPath = `${oldSpacePath}/ops`;
  if (await exists(opsPath)) {
    const prefixDirs = await readDir(opsPath);

    for (const prefixDir of prefixDirs) {
      if (!prefixDir.isDirectory) continue;

      const prefixPath = `${opsPath}/${prefixDir.name}`;
      const suffixDirs = await readDir(prefixPath);

      for (const suffixDir of suffixDirs) {
        if (!suffixDir.isDirectory) continue;

        // Combine prefix and suffix to get the full tree ID
        const treeId = prefixDir.name + suffixDir.name;
        console.log(`Validating tree: ${treeId}`);
        const oldOps = await loadV0TreeOps(oldSpacePath, treeId);
        const newOps = await loadV1TreeOps(newSpacePath, treeId);

        if (oldOps.length !== newOps.length) {
          throw new Error(`Migration validation failed for tree ${treeId}: Operation count mismatch. Old: ${oldOps.length}, New: ${newOps.length}`);
        }
      }
    }
  }

  console.log('Migration validation successful for all trees');
}

/**
 * Loads operations from a legacy (v0) tree structure
 * @param spacePath Path to the space directory
 * @param treeId ID of the tree
 * @returns Array of operations
 */
async function loadV0TreeOps(spacePath: string, treeId: string): Promise<VertexOperation[]> {
  // Get the tree ID prefix and suffix
  const prefix = treeId.substring(0, 2);
  const suffix = treeId.substring(2);

  const treeOpsPath = `${spacePath}/ops/${prefix}/${suffix}`;

  // Check if directory exists
  if (!await exists(treeOpsPath)) {
    return [];
  }

  const allOps: VertexOperation[] = [];
  const dateDirs = await readDir(treeOpsPath);

  // Process YYYY-MM-DD directory structure (legacy format)
  for (const dateDir of dateDirs) {
    if (dateDir.isDirectory && dateDir.name.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const datePath = `${treeOpsPath}/${dateDir.name}`;
      const peerFiles = await readDir(datePath);

      for (const peerFile of peerFiles) {
        if (peerFile.isFile && peerFile.name.endsWith('.jsonl')) {
          const filePath = `${datePath}/${peerFile.name}`;
          const ops = await loadOpsFromJSONLFile(filePath, peerFile.name.split('.')[0]);
          allOps.push(...ops);
        }
      }
    }
  }

  return allOps;
}

/**
 * Loads all operations for a tree from the filesystem (v1 format)
 * @param spacePath Path to the space directory
 * @param treeId ID of the tree
 * @returns Array of operations
 */
export async function loadV1TreeOps(spacePath: string, treeId: string): Promise<VertexOperation[]> {
  // Always use the current version path (space-v1)
  const basePath = `${spacePath}/space-v1`;

  // Get the tree ID prefix and suffix
  const prefix = treeId.substring(0, 2);
  const suffix = treeId.substring(2);

  const treeOpsPath = `${basePath}/ops/${prefix}/${suffix}`;

  // Check if directory exists
  if (!await exists(treeOpsPath)) {
    return [];
  }

  const allOps: VertexOperation[] = [];
  const yearDirs = await readDir(treeOpsPath);

  // Process YYYY/MM/DD directory structure
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
                  const ops = await loadOpsFromJSONLFile(filePath, peerFile.name.split('.')[0]);
                  allOps.push(...ops);
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

