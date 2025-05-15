# Local Space Migrations Proposal

## Current Structure

Currently, Supa stores spaces in a directory structure as follows:

```
/space-directory/
  space.json           # Contains space metadata (ID)
  secrets              # Encrypted space secrets
  ops/                 # Operations directory
    xx/                # First 2 chars of tree ID
      xxxxxxxxxx/      # Rest of tree ID
        YYYY-MM-DD/    # Date directory
          peerId.jsonl # Operations file for a specific peer
```

This structure works well but has some limitations:
1. No clear versioning for space format changes
2. Difficult to perform migrations between versions
3. No standardized location for space-specific metadata
4. No clear migration path for future changes

## Proposed Structure

We propose changing the space structure to use a versioned approach:

```
/space-directory/
  README.md            # Brief description of what a Supa space is and warnings about not modifying
  supa-space-v1/       # Version-specific directory
    space.json         # Contains space metadata (ID)
    secrets            # Encrypted space secrets
    ops/               # Operations directory
      xx/              # First 2 chars of tree ID
        xxxxxxxxxx/    # Rest of tree ID
          YYYY/        # Year
            MM/        # Month
              DD/      # Day
                peerId.json # Operations file for a specific peer
```

### Key Changes

1. **Versioned Root Directory**: 
   - All space content is contained within a versioned directory (`supa-space-v1/`)
   - Future versions will create new directories (`supa-space-v2/`, etc.)

2. **README.md**:
   - Provides a brief description of what a Supa space is
   - Warns users not to rename or modify the `supa-space-vX` directory
   - Explains the purpose of the space structure

3. **Improved Date Organization**:
   - Date directories are split into year/month/day for better organization
   - This structure scales better with large numbers of operations

4. **Migration Path**:
   - When updating to a new version, both old and new versions can coexist during migration
   - After successful migration, old versions can be scheduled for deletion

## Migration Strategy

### Version Migration Process

1. **Detection**:
   - When loading a space, check for the existence of the latest version directory
   - If not found, scan for the highest available version directory

2. **Migration**:
   - Create the new version directory structure
   - Migrate data from the old version to the new version
   - Create a migration log file to track the migration process

3. **Verification**:
   - Verify that the migrated data is correct and complete
   - Run validation tests on the new structure

4. **Cleanup**:
   - After successful migration, create a `scheduled-to-delete-old-version` file in the old version directory
   - This file contains a timestamp for when the old version can be safely deleted
   - During future loads, check for and delete expired old versions

### Implementation Plan

1. **Phase 1: Structure Update**
   - Update `LocalSpaceSync.ts` to support the new directory structure
   - Maintain backward compatibility with the existing structure
   - Add version detection logic

2. **Phase 2: Migration Implementation**
   - Implement migration logic between versions
   - Create migration utilities for specific version pairs
   - Add validation and verification steps

3. **Phase 3: Cleanup Mechanism**
   - Implement the delayed deletion mechanism
   - Add cleanup checks during space loading

## Code Changes

### Migration Stub

In `loadLocalSpace` function in `LocalSpaceSync.ts`, we'll need to add:

```typescript
// Check for versioned space directories
const latestVersion = 1; // Current latest version
let currentVersion = 0;

// Check if the latest version exists
if (await exists(`${path}/supa-space-v${latestVersion}`)) {
  currentVersion = latestVersion;
} else {
  // Find the highest available version
  const entries = await readDir(path);
  for (const entry of entries) {
    if (entry.isDirectory && entry.name.startsWith('supa-space-v')) {
      const versionStr = entry.name.replace('supa-space-v', '');
      const version = parseFloat(versionStr);
      if (!isNaN(version) && version > currentVersion) {
        currentVersion = version;
      }
    }
  }
}

// If we need to migrate
if (currentVersion < latestVersion) {
  await migrateSpace(path, currentVersion, latestVersion);
}

// Check for scheduled deletions
await checkScheduledDeletions(path);
```

### New Helper Functions

```typescript
async function migrateSpace(spacePath: string, fromVersion: number, toVersion: number): Promise<void> {
  console.log(`Migrating space from v${fromVersion} to v${toVersion}`);
  
  // Create the new version directory
  const newVersionPath = `${spacePath}/supa-space-v${toVersion}`;
  await mkdir(newVersionPath, { recursive: true });
  
  // Perform version-specific migrations
  if (fromVersion === 0 && toVersion === 1) {
    await migrateFromV0ToV1(spacePath, newVersionPath);
  } else {
    throw new Error(`Unsupported migration path: v${fromVersion} to v${toVersion}`);
  }
  
  // Create a README.md file
  await writeTextFile(`${spacePath}/README.md`, 
    `# Supa Space\n\nThis directory contains a Supa space. Please do not rename or modify the 'supa-space-v${toVersion}' directory structure as it may corrupt your data.`);
  
  // Schedule old version for deletion (30 days from now)
  const deletionDate = new Date();
  deletionDate.setDate(deletionDate.getDate() + 30);
  
  if (fromVersion > 0) {
    await writeTextFile(
      `${spacePath}/supa-space-v${fromVersion}/scheduled-to-delete-old-version`,
      deletionDate.toISOString()
    );
  }
}

async function migrateFromV0ToV1(oldPath: string, newPath: string): Promise<void> {
  // Copy space.json
  const spaceJson = await readTextFile(`${oldPath}/space.json`);
  await writeTextFile(`${newPath}/space.json`, spaceJson);
  
  // Copy secrets if they exist
  if (await exists(`${oldPath}/secrets`)) {
    const secrets = await readTextFile(`${oldPath}/secrets`);
    await writeTextFile(`${newPath}/secrets`, secrets);
  }
  
  // Create ops directory
  await mkdir(`${newPath}/ops`, { recursive: true });
  
  // Migrate ops
  const oldOpsPath = `${oldPath}/ops`;
  if (await exists(oldOpsPath)) {
    const treeIdPrefixes = await readDir(oldOpsPath);
    for (const prefix of treeIdPrefixes) {
      if (prefix.isDirectory) {
        const treeIdSuffixes = await readDir(`${oldOpsPath}/${prefix.name}`);
        for (const suffix of treeIdSuffixes) {
          if (suffix.isDirectory) {
            const treeId = prefix.name + suffix.name;
            const dateDirs = await readDir(`${oldOpsPath}/${prefix.name}/${suffix.name}`);
            
            for (const dateDir of dateDirs) {
              if (dateDir.isDirectory && dateDir.name.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // Parse the date
                const [year, month, day] = dateDir.name.split('-');
                
                // Create new directory structure
                const newDatePath = `${newPath}/ops/${prefix.name}/${suffix.name}/${year}/${month}/${day}`;
                await mkdir(newDatePath, { recursive: true });
                
                // Copy all peer files
                const peerFiles = await readDir(`${oldOpsPath}/${prefix.name}/${suffix.name}/${dateDir.name}`);
                for (const peerFile of peerFiles) {
                  if (peerFile.isFile && peerFile.name.endsWith('.jsonl')) {
                    const content = await readTextFile(`${oldOpsPath}/${prefix.name}/${suffix.name}/${dateDir.name}/${peerFile.name}`);
                    // Change extension from .jsonl to .json
                    const newFileName = peerFile.name.replace('.jsonl', '.json');
                    await writeTextFile(`${newDatePath}/${newFileName}`, content);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

async function checkScheduledDeletions(spacePath: string): Promise<void> {
  const entries = await readDir(spacePath);
  const now = new Date();
  
  for (const entry of entries) {
    if (entry.isDirectory && entry.name.startsWith('supa-space-v')) {
      const deletionFilePath = `${spacePath}/${entry.name}/scheduled-to-delete-old-version`;
      
      if (await exists(deletionFilePath)) {
        const deletionDateStr = await readTextFile(deletionFilePath);
        const deletionDate = new Date(deletionDateStr);
        
        if (now >= deletionDate) {
          console.log(`Deleting old version: ${entry.name}`);
          // In a real implementation, we would use a recursive delete function
          // For now, we'll just log it
          // await removeDir(`${spacePath}/${entry.name}`, { recursive: true });
        }
      }
    }
  }
}
```

## Benefits

1. **Clear Versioning**: The versioned directory structure makes it clear which version of the space format is being used.

2. **Safer Migrations**: By keeping both old and new versions during migration, we reduce the risk of data loss.

3. **Better Organization**: The improved date structure (year/month/day) is more scalable and easier to navigate.

4. **Documentation**: The README.md file helps users understand what the space is and how to handle it.

5. **Future-Proofing**: This approach establishes a clear pattern for handling future format changes.

## Risks and Mitigations

1. **Risk**: Data loss during migration
   **Mitigation**: Keep old version until new version is verified

2. **Risk**: Increased disk usage during migration
   **Mitigation**: Scheduled deletion of old versions after a safe period

3. **Risk**: Compatibility issues with older Supa versions
   **Mitigation**: Maintain backward compatibility in the codebase

## Next Steps

1. Implement the version detection and migration stub in `LocalSpaceSync.ts`
2. Create tests for the migration process
3. Update documentation to reflect the new structure
4. Plan for the first real migration (v0 to v1)
