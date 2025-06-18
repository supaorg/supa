# Proposal: Refactor Secrets Storage Architecture

**Status**: Draft  
**Author**: Development Team  
**Date**: 2024-12-30  

## Problem Statement

The current secrets storage architecture bundles all API keys and secrets into a single object within the `SpaceSetup` record. This approach has led to several issues:

1. **Data Loss Bug**: Adding new model provider API keys can overwrite existing ones due to improper merging in the persistence layer
2. **Atomic Operations**: All secrets must be read/written together, even when modifying a single key
3. **Merge Complexity**: The codebase requires careful merging logic to avoid data loss
4. **Race Conditions**: Concurrent updates to different secrets can conflict

### Current Architecture

```typescript
// SpaceSetup in localDb.ts
interface SpaceSetup {
  id: string;
  name: string;
  secrets?: { [key: string]: string } | null;
  // ... other fields
}
```

All provider API keys are stored in the `secrets` object:
```typescript
{
  "anthropic_api_key": "sk-...",
  "openai_api_key": "sk-...",
  "google_api_key": "AIza..."
}
```

## Proposed Solution

Refactor to use individual secret records that can be managed independently.

### New Architecture

```typescript
// New SecretRecord table
interface SecretRecord {
  id: string;           // composite key: spaceId + secretKey
  spaceId: string;
  secretKey: string;    // e.g., "anthropic_api_key"
  secretValue: string;
  createdAt: Date;
  updatedAt: Date;
}

// Updated SpaceSetup (secrets field removed)
interface SpaceSetup {
  id: string;
  name: string;
  // secrets field removed
  // ... other fields
}
```

### Database Schema Changes

```typescript
class LocalDb extends Dexie {
  spaces!: Table<SpaceSetup>;
  secrets!: Table<SecretRecord>;  // New table
  config!: Table<ConfigItem>;
  treeOps!: Table<TreeOp>;

  constructor() {
    super('LocalDb');
    this.version(2).stores({  // Increment version
      spaces: 'id, name, createdAt',
      secrets: 'id, spaceId, secretKey, [spaceId+secretKey]',  // Composite index
      config: 'key',
      treeOps: 'id, spaceId, timestamp'
    });
  }
}
```

## Benefits

1. **Eliminates Data Loss**: Each secret is stored independently, preventing overwrites
2. **Atomic Operations**: Can update individual secrets without affecting others
3. **Simplified Logic**: No more complex merging operations required
4. **Better Performance**: Can query/update specific secrets without loading all
5. **Audit Trail**: Each secret has its own timestamps for tracking changes
6. **Scalability**: Better suited for larger numbers of API keys per space

## Implementation Plan

### Phase 1: Database Migration
- [ ] Add new `SecretRecord` table to schema
- [ ] Create migration function to move existing secrets to new table
- [ ] Update database version and migration logic

### Phase 2: API Updates
- [ ] Update `setSecret()` to use new table
- [ ] Update `getSecret()` to query new table
- [ ] Update `getAllSecrets()` to aggregate from new table
- [ ] Remove `saveAllSecrets()` (no longer needed)

### Phase 3: Component Updates
- [ ] Update components that interact with secrets
- [ ] Test model provider configuration flows
- [ ] Verify sync functionality works with new schema

### Phase 4: Cleanup
- [ ] Remove `secrets` field from `SpaceSetup` interface
- [ ] Remove old migration code after deployment
- [ ] Update documentation

## Migration Strategy

```typescript
async function migrateSecretsToIndividualRecords() {
  const spacesWithSecrets = await db.spaces.where('secrets').above('').toArray();
  
  for (const space of spacesWithSecrets) {
    if (space.secrets) {
      for (const [key, value] of Object.entries(space.secrets)) {
        await db.secrets.add({
          id: `${space.id}_${key}`,
          spaceId: space.id,
          secretKey: key,
          secretValue: value,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // Clear old secrets field
      await db.spaces.where('id').equals(space.id).modify({ secrets: undefined });
    }
  }
}
```

## Backward Compatibility

- Migration will be automatic on database version upgrade
- Old code will continue to work during transition period
- New API will be additive until old code is removed

## Risks and Mitigation

1. **Migration Complexity**: Test thoroughly with various secret configurations
2. **Sync Impact**: Ensure RepTree sync handles schema changes gracefully
3. **Performance**: Monitor query performance with individual records vs. bundled object

## Success Criteria

- [ ] No data loss during migration
- [ ] All model provider configurations work correctly
- [ ] No regression in sync functionality
- [ ] Performance is equivalent or better
- [ ] Code is simpler and more maintainable 