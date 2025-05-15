# Testing Space Migrations Proposal

## Overview

This document outlines a comprehensive testing strategy for the space migration system in Supa. The migration system will convert legacy spaces (v0) to the new versioned format (v1). Proper testing is critical to ensure data integrity and prevent loss of user data during migrations.

## Testing Goals

1. Verify the correct detection of space versions
2. Ensure the migration process preserves all data
3. Test the locking mechanism to prevent concurrent migrations
4. Validate error handling and recovery from interrupted migrations
5. Measure performance for large spaces
6. Test integration with the existing codebase

## Test Environment Setup

### Test Directory Structure

```typescript
/**
 * Creates a test environment with spaces in various formats
 * @param testDir Base directory for tests
 * @returns Object containing paths to test spaces
 */
async function setupTestEnvironment(testDir: string) {
  // Create test directory
  await mkdir(testDir, { recursive: true });
  
  // Create spaces in different formats
  const legacySpacePath = `${testDir}/legacy-space`;
  const emptySpacePath = `${testDir}/empty-space`;
  const corruptedSpacePath = `${testDir}/corrupted-space`;
  
  // Create a legacy (v0) space for migration testing
  await createLegacyTestSpace(legacySpacePath);
  
  // Create an empty directory (should fail version detection)
  await mkdir(emptySpacePath, { recursive: true });
  
  // Create a corrupted space (has space.json but no ops)
  await mkdir(corruptedSpacePath, { recursive: true });
  await writeTextFile(`${corruptedSpacePath}/space.json`, JSON.stringify({ id: uuid() }));
  
  return {
    legacySpacePath,
    emptySpacePath,
    corruptedSpacePath
  };
}
```

### Creating Test Spaces

We need to create test spaces with predictable content:

```typescript
/**
 * Creates a test legacy space (v0) with predictable content
 * @param spacePath Path where the test space will be created
 */
async function createLegacyTestSpace(spacePath: string): Promise<void> {
  // Create space directory
  await mkdir(spacePath, { recursive: true });
  
  // Create space ID
  const spaceId = uuid();
  
  // Create space.json directly in the root (v0 format)
  await writeTextFile(`${spacePath}/space.json`, JSON.stringify({ id: spaceId }));
  
  // Create secrets
  await writeTextFile(`${spacePath}/secrets`, 'test-secrets-content');
  
  // Create ops directory structure
  const prefix = spaceId.substring(0, 2);
  const suffix = spaceId.substring(2);
  const opsPath = `${spacePath}/ops/${prefix}/${suffix}`;
  await mkdir(opsPath, { recursive: true });
  
  // Create date directories and ops files in legacy format (YYYY-MM-DD)
  const dates = ['2023-01-01', '2023-02-15', '2023-03-30'];
  const peerIds = ['peer1', 'peer2'];
  
  for (const date of dates) {
    const datePath = `${opsPath}/${date}`;
    await mkdir(datePath, { recursive: true });
    
    for (const peerId of peerIds) {
      // Create sample operations for this peer
      const ops = [
        `["m",1,"${uuid()}","${uuid()}"]\n`,
        `["p",2,"${uuid()}","name","test value"]\n`,
        `["m",3,"${uuid()}",null]\n`
      ].join('');
      
      await writeTextFile(`${datePath}/${peerId}.jsonl`, ops);
    }
  }
}
```

## Unit Tests

### Version Detection Tests

```typescript
describe('Space Version Detection', () => {
  let testPaths: { legacySpacePath: string, emptySpacePath: string, corruptedSpacePath: string };
  
  beforeAll(async () => {
    testPaths = await setupTestEnvironment('/tmp/supa-version-detection-tests');
  });
  
  it('should detect legacy spaces as version 0', async () => {
    const version = await detectSpaceVersion(testPaths.legacySpacePath);
    expect(version).toBe(0);
  });
  
  it('should throw an error for empty directories', async () => {
    await expect(detectSpaceVersion(testPaths.emptySpacePath)).rejects.toThrow();
  });
  
  it('should handle corrupted spaces appropriately', async () => {
    const version = await detectSpaceVersion(testPaths.corruptedSpacePath);
    expect(version).toBe(0); // Corrupted but has space.json, so detected as v0
  });
  
  afterAll(async () => {
    // Clean up test directories
    await removeDir('/tmp/supa-version-detection-tests', { recursive: true });
  });
});
```

### Migration Lock Tests

```typescript
describe('Migration Lock Mechanism', () => {
  let testPath: string;
  
  beforeEach(async () => {
    // Create a fresh test directory for each test
    testPath = `/tmp/supa-lock-tests-${Date.now()}`;
    await mkdir(testPath, { recursive: true });
  });
  
  it('should create and release locks properly', async () => {
    const releaseLock = await acquireMigrationLock(testPath, 0, 1);
    
    // Verify lock exists
    const lockExists = await exists(`${testPath}/migration.lock`);
    expect(lockExists).toBe(true);
    
    // Release lock
    await releaseLock();
    
    // Verify lock is gone
    const lockExistsAfterRelease = await exists(`${testPath}/migration.lock`);
    expect(lockExistsAfterRelease).toBe(false);
  });
  
  it('should detect active migrations', async () => {
    const releaseLock = await acquireMigrationLock(testPath, 0, 1);
    
    // Check if migration is detected as in progress
    const inProgress = await isMigrationInProgress(testPath);
    expect(inProgress).toBe(true);
    
    await releaseLock();
  });
  
  it('should detect stale locks', async () => {
    // Create a stale lock (older than 60 seconds)
    await writeTextFile(`${testPath}/migration.lock`, JSON.stringify({
      startTime: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
      lastUpdateTime: new Date(Date.now() - 120000).toISOString()
    }));
    
    // Check if migration is detected as not in progress (stale)
    const inProgress = await isMigrationInProgress(testPath);
    expect(inProgress).toBe(false);
  });
  
  afterEach(async () => {
    // Clean up test directory
    await removeDir(testPath, { recursive: true });
  });
});
```

## Integration Tests

### Full Migration Process Tests

```typescript
describe('Full Migration Process', () => {
  let legacySpacePath: string;
  let migrationTestPath: string;
  
  beforeAll(async () => {
    // Set up test environment
    const testPaths = await setupTestEnvironment('/tmp/supa-migration-integration-tests');
    legacySpacePath = testPaths.legacySpacePath;
    
    // Make a copy for migration testing
    migrationTestPath = '/tmp/supa-migration-integration-tests/migration-test';
    await copyDirectory(legacySpacePath, migrationTestPath);
  });
  
  it('should successfully migrate from legacy to v1', async () => {
    // Run migration
    await migrateSpace(migrationTestPath);
    
    // Verify migration artifacts
    const v1Exists = await exists(`${migrationTestPath}/space-v1`);
    expect(v1Exists).toBe(true);
    
    const readmeExists = await exists(`${migrationTestPath}/README.md`);
    expect(readmeExists).toBe(true);
    
    const migratedJsonExists = await exists(`${migrationTestPath}/migrated.json`);
    expect(migratedJsonExists).toBe(true);
    
    // Verify space.json was copied correctly
    const originalSpaceJson = await readTextFile(`${legacySpacePath}/space.json`);
    const migratedSpaceJson = await readTextFile(`${migrationTestPath}/space-v1/space.json`);
    expect(migratedSpaceJson).toBe(originalSpaceJson);
    
    // Verify secrets were copied correctly
    const originalSecrets = await readTextFile(`${legacySpacePath}/secrets`);
    const migratedSecrets = await readTextFile(`${migrationTestPath}/space-v1/secrets`);
    expect(migratedSecrets).toBe(originalSecrets);
  });
  
  it('should be able to load the migrated space', async () => {
    // Load the migrated space
    const space = await loadLocalSpace(migrationTestPath);
    
    // Verify space was loaded correctly
    expect(space).toBeInstanceOf(Space);
    
    // Verify space has the correct ID
    const originalSpaceData = JSON.parse(await readTextFile(`${legacySpacePath}/space.json`));
    expect(space.getId()).toBe(originalSpaceData.id);
  });
  
  afterAll(async () => {
    // Clean up test directories
    await removeDir('/tmp/supa-migration-integration-tests', { recursive: true });
  });
});
```

### Operation Migration Tests

```typescript
describe('Operation Migration', () => {
  let legacySpacePath: string;
  let migrationTestPath: string;
  
  beforeAll(async () => {
    // Set up test environment
    const testPaths = await setupTestEnvironment('/tmp/supa-ops-migration-tests');
    legacySpacePath = testPaths.legacySpacePath;
    
    // Make a copy for migration testing
    migrationTestPath = '/tmp/supa-ops-migration-tests/migration-test';
    await copyDirectory(legacySpacePath, migrationTestPath);
    
    // Run migration
    await migrateSpace(migrationTestPath);
  });
  
  it('should migrate all operations correctly', async () => {
    // Get space ID
    const spaceData = JSON.parse(await readTextFile(`${legacySpacePath}/space.json`));
    const spaceId = spaceData.id;
    
    // Load operations from both legacy and migrated spaces
    const legacyOps = await loadAllTreeOps(legacySpacePath, spaceId, true); // true = legacy format
    const migratedOps = await loadAllTreeOps(migrationTestPath, spaceId, false); // false = new format
    
    // Verify operation counts match
    expect(migratedOps.length).toBe(legacyOps.length);
    
    // Sort operations by counter for comparison
    const sortedLegacyOps = legacyOps.sort((a, b) => a.id.counter - b.id.counter);
    const sortedMigratedOps = migratedOps.sort((a, b) => a.id.counter - b.id.counter);
    
    // Compare each operation
    for (let i = 0; i < sortedLegacyOps.length; i++) {
      const legacyOp = sortedLegacyOps[i];
      const migratedOp = sortedMigratedOps[i];
      
      expect(migratedOp.id.counter).toBe(legacyOp.id.counter);
      expect(migratedOp.id.peerId).toBe(legacyOp.id.peerId);
      expect(migratedOp.targetId).toBe(legacyOp.targetId);
      
      if (isMoveVertexOp(legacyOp) && isMoveVertexOp(migratedOp)) {
        expect(migratedOp.parentId).toBe(legacyOp.parentId);
      } else if (isAnyPropertyOp(legacyOp) && isAnyPropertyOp(migratedOp)) {
        expect(migratedOp.key).toBe(legacyOp.key);
        expect(JSON.stringify(migratedOp.value)).toBe(JSON.stringify(legacyOp.value));
      }
    }
  });
  
  afterAll(async () => {
    // Clean up test directories
    await removeDir('/tmp/supa-ops-migration-tests', { recursive: true });
  });
});
```

## Edge Case Tests

```typescript
describe('Migration Edge Cases', () => {
  let testDir: string;
  
  beforeEach(async () => {
    // Create a fresh test directory
    testDir = `/tmp/supa-edge-cases-${Date.now()}`;
    const testPaths = await setupTestEnvironment(testDir);
  });
  
  it('should handle concurrent migration attempts', async () => {
    const spacePath = `${testDir}/concurrent-test`;
    await createLegacyTestSpace(spacePath);
    
    // Create a lock file to simulate an in-progress migration
    await writeTextFile(`${spacePath}/migration.lock`, JSON.stringify({
      startTime: new Date().toISOString(),
      lastUpdateTime: new Date().toISOString(),
      version: { from: 0, to: 1 }
    }));
    
    // Attempt to migrate should fail
    await expect(migrateSpace(spacePath)).rejects.toThrow(/Migration already in progress/);
    
    // Force override should succeed
    await expect(migrateSpace(spacePath, undefined, true)).resolves.not.toThrow();
  });
  
  it('should handle interrupted migrations', async () => {
    const spacePath = `${testDir}/interrupted-test`;
    await createLegacyTestSpace(spacePath);
    
    // Create a temporary directory to simulate an interrupted migration
    const tempDirPath = `${spacePath}/.temp-migration-v1-${Date.now()}`;
    await mkdir(tempDirPath, { recursive: true });
    
    // Migration should succeed despite existing temp directory
    await expect(migrateSpace(spacePath)).resolves.not.toThrow();
    
    // Verify migration succeeded
    const v1Exists = await exists(`${spacePath}/space-v1`);
    expect(v1Exists).toBe(true);
  });
  
  it('should handle spaces with missing operations', async () => {
    const spacePath = `${testDir}/missing-ops-test`;
    await createLegacyTestSpace(spacePath);
    
    // Remove all operations
    await removeDir(`${spacePath}/ops`, { recursive: true });
    await mkdir(`${spacePath}/ops`, { recursive: true });
    
    // Migration should still succeed (though loading might fail later)
    await expect(migrateSpace(spacePath)).resolves.not.toThrow();
  });
  
  afterEach(async () => {
    // Clean up test directory
    await removeDir(testDir, { recursive: true });
  });
});
```

## Performance Tests

```typescript
describe('Migration Performance', () => {
  let largeSpacePath: string;
  
  beforeAll(async () => {
    // Create a large test space
    largeSpacePath = '/tmp/supa-performance-test';
    await createLargeTestSpace(largeSpacePath);
  });
  
  it('should migrate large spaces within acceptable time', async () => {
    const startTime = Date.now();
    
    await migrateSpace(largeSpacePath);
    
    const endTime = Date.now();
    const durationSeconds = (endTime - startTime) / 1000;
    
    // Log performance metrics
    console.log(`Large space migration completed in ${durationSeconds} seconds`);
    
    // Set a reasonable threshold based on expected performance
    expect(durationSeconds).toBeLessThan(30); // Adjust threshold as needed
  });
  
  afterAll(async () => {
    // Clean up test directory
    await removeDir('/tmp/supa-performance-test', { recursive: true });
  });
});

/**
 * Creates a large test space for performance testing
 * @param spacePath Path where the test space will be created
 */
async function createLargeTestSpace(spacePath: string): Promise<void> {
  // Create basic space structure
  await mkdir(spacePath, { recursive: true });
  
  // Create space ID
  const spaceId = uuid();
  await writeTextFile(`${spacePath}/space.json`, JSON.stringify({ id: spaceId }));
  
  // Create ops directory structure
  const prefix = spaceId.substring(0, 2);
  const suffix = spaceId.substring(2);
  const opsPath = `${spacePath}/ops/${prefix}/${suffix}`;
  await mkdir(opsPath, { recursive: true });
  
  // Create 100 date directories
  const dates = [];
  for (let month = 1; month <= 12; month++) {
    for (let day = 1; day <= 28; day += 7) {
      dates.push(`2023-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
    }
  }
  
  // Create 10 peers
  const peerIds = [];
  for (let i = 1; i <= 10; i++) {
    peerIds.push(`peer${i}`);
  }
  
  // Create operations
  for (const date of dates) {
    const datePath = `${opsPath}/${date}`;
    await mkdir(datePath, { recursive: true });
    
    for (const peerId of peerIds) {
      // Create 100 operations per peer
      let ops = '';
      for (let i = 1; i <= 100; i++) {
        if (i % 2 === 0) {
          ops += `["m",${i},"${uuid()}","${uuid()}"]\n`;
        } else {
          ops += `["p",${i},"${uuid()}","prop${i}","value${i}"]\n`;
        }
      }
      
      await writeTextFile(`${datePath}/${peerId}.jsonl`, ops);
    }
  }
}
```

## Integration with Existing Codebase

```typescript
describe('Integration with LocalSpaceSync', () => {
  let legacySpacePath: string;
  
  beforeAll(async () => {
    // Set up test environment
    const testPaths = await setupTestEnvironment('/tmp/supa-integration-tests');
    legacySpacePath = testPaths.legacySpacePath;
  });
  
  it('should correctly load and migrate a legacy space', async () => {
    // Create a copy for testing
    const testPath = '/tmp/supa-integration-tests/load-test';
    await copyDirectory(legacySpacePath, testPath);
    
    // Load the space, which should trigger migration
    const space = await loadLocalSpace(testPath);
    
    // Verify space was loaded correctly
    expect(space).toBeInstanceOf(Space);
    
    // Verify migration occurred
    const v1Exists = await exists(`${testPath}/space-v1`);
    expect(v1Exists).toBe(true);
  });
  
  it('should handle migration in progress during load', async () => {
    // Create a copy for testing
    const testPath = '/tmp/supa-integration-tests/load-lock-test';
    await copyDirectory(legacySpacePath, testPath);
    
    // Create a lock file
    await writeTextFile(`${testPath}/migration.lock`, JSON.stringify({
      startTime: new Date().toISOString(),
      lastUpdateTime: new Date().toISOString(),
      version: { from: 0, to: 1 }
    }));
    
    // Loading should fail with migration in progress error
    await expect(loadLocalSpace(testPath)).rejects.toThrow(/Migration in progress/);
    
    // Loading with waitForMigration should wait for lock to become stale
    // This is hard to test in a unit test, so we'll make the lock stale first
    await writeTextFile(`${testPath}/migration.lock`, JSON.stringify({
      startTime: new Date(Date.now() - 120000).toISOString(),
      lastUpdateTime: new Date(Date.now() - 120000).toISOString()
    }));
    
    // Now loading should succeed
    const space = await loadLocalSpace(testPath, true);
    expect(space).toBeInstanceOf(Space);
  });
  
  afterAll(async () => {
    // Clean up test directories
    await removeDir('/tmp/supa-integration-tests', { recursive: true });
  });
});
```

## Test Helpers

```typescript
/**
 * Copies a directory and its contents recursively
 * @param sourcePath Source directory path
 * @param destPath Destination directory path
 */
async function copyDirectory(sourcePath: string, destPath: string): Promise<void> {
  // Create destination directory
  await mkdir(destPath, { recursive: true });
  
  // Read all entries in source directory
  const entries = await readDir(sourcePath);
  
  // Copy each entry
  for (const entry of entries) {
    const sourceEntryPath = `${sourcePath}/${entry.name}`;
    const destEntryPath = `${destPath}/${entry.name}`;
    
    if (entry.isDirectory) {
      // Recursively copy subdirectory
      await copyDirectory(sourceEntryPath, destEntryPath);
    } else {
      // Copy file
      const content = await readTextFile(sourceEntryPath);
      await writeTextFile(destEntryPath, content);
    }
  }
}
```

## Continuous Integration

To ensure migrations remain reliable over time, we should integrate these tests into our CI pipeline:

1. Add a dedicated test job for space migrations
2. Run tests with different space sizes (small, medium, large)
3. Track performance metrics over time
4. Automatically create test spaces with the correct structure

## Manual Testing

In addition to automated tests, we should perform manual testing:

1. Create real spaces with the legacy structure
2. Test migration with the UI
3. Verify all data is preserved after migration
4. Test migration cancellation and resumption
5. Test with spaces containing a variety of content types

## Conclusion

This testing strategy provides comprehensive coverage for the space migration system. By implementing these tests, we can ensure that migrations are reliable, data is preserved, and users have a smooth experience when upgrading to the new space format.

The tests are designed to be maintainable and extensible, allowing for future migration paths (e.g., v1 to v2) to be tested using the same framework.
