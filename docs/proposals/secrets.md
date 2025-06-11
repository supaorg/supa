# Secrets Persistence Proposal

## Current Problem
Secrets in the Space class are stored only in memory (`private secrets: Record<string, string> | undefined`), causing them to be lost when the application closes.

## Proposed Solution: Store in SpaceSetup

Instead of creating a separate table, we should store secrets directly in the existing `SpaceSetup` type, following the same pattern already used for `drafts`, `theme`, etc.

### 1. Update SpaceSetup Type

```typescript
export type SpaceSetup = {
  id: string;
  uri: string;
  name: string | null;
  createdAt: Date;
  
  // Additional fields
  ttabsLayout?: string | null;
  theme?: string | null;
  colorScheme?: 'light' | 'dark' | null;
  drafts?: { [draftId: string]: string } | null;
  secrets?: { [key: string]: string } | null; // Add this
};
```

### 2. Add Database Operations

Add functions to `localDb.ts`:

```typescript
// Get all secrets for a space
export async function getSpaceSecrets(spaceId: string): Promise<Record<string, string>> {
  try {
    const space = await db.spaces.get(spaceId);
    return space?.secrets || {};
  } catch (error) {
    console.error(`Failed to get secrets for space ${spaceId}:`, error);
    return {};
  }
}

// Save all secrets for a space
export async function saveSpaceSecrets(spaceId: string, secrets: Record<string, string>): Promise<void> {
  try {
    await db.spaces
      .where('id')
      .equals(spaceId)
      .modify({ secrets });
  } catch (error) {
    console.error(`Failed to save secrets for space ${spaceId}:`, error);
  }
}

// Get a single secret
export async function getSpaceSecret(spaceId: string, key: string): Promise<string | undefined> {
  try {
    const space = await db.spaces.get(spaceId);
    return space?.secrets?.[key];
  } catch (error) {
    console.error(`Failed to get secret ${key} for space ${spaceId}:`, error);
    return undefined;
  }
}

// Set a single secret
export async function setSpaceSecret(spaceId: string, key: string, value: string): Promise<void> {
  try {
    await db.spaces
      .where('id')
      .equals(spaceId)
      .modify((space) => {
        if (!space.secrets) {
          space.secrets = {};
        }
        space.secrets[key] = value;
      });
  } catch (error) {
    console.error(`Failed to set secret ${key} for space ${spaceId}:`, error);
  }
}

// Delete a secret
export async function deleteSpaceSecret(spaceId: string, key: string): Promise<void> {
  try {
    await db.spaces
      .where('id')
      .equals(spaceId)
      .modify((space) => {
        if (space.secrets && space.secrets[key]) {
          delete space.secrets[key];
        }
      });
  } catch (error) {
    console.error(`Failed to delete secret ${key} for space ${spaceId}:`, error);
  }
}
```

### 3. Update Space Class

Modify the Space class to use database operations:

```typescript
class Space {
  private secrets: Record<string, string> | undefined;

  // Load secrets from database when initializing
  private async loadSecrets(): Promise<void> {
    this.secrets = await getSpaceSecrets(this.id);
  }

  async getAllSecrets(): Promise<Record<string, string>> {
    if (!this.secrets) {
      await this.loadSecrets();
    }
    return { ...this.secrets };
  }

  async saveAllSecrets(secrets: Record<string, string>): Promise<void> {
    this.secrets = { ...secrets };
    await saveSpaceSecrets(this.id, this.secrets);
  }

  async getSecret(key: string): Promise<string | undefined> {
    if (!this.secrets) {
      await this.loadSecrets();
    }
    return this.secrets[key];
  }

  async setSecret(key: string, value: string): Promise<void> {
    if (!this.secrets) {
      await this.loadSecrets();
    }
    this.secrets[key] = value;
    await setSpaceSecret(this.id, key, value);
  }

  async deleteSecret(key: string): Promise<void> {
    if (!this.secrets) {
      await this.loadSecrets();
    }
    delete this.secrets[key];
    await deleteSpaceSecret(this.id, key);
  }
}
```

## Benefits of This Approach

1. **Consistency** - Follows existing pattern used by `drafts`, `theme`, etc.
2. **Simplicity** - No new tables or complex schema changes needed
3. **Atomic operations** - Secrets are managed alongside other space data
4. **Familiar API** - Database operations follow existing patterns
5. **Easy migration** - Just add the optional field to existing spaces

## Security Considerations

- Secrets stored in plain text in IndexedDB (can add encryption later if needed)
- IndexedDB is origin-sandboxed, providing basic security
- Consider adding encryption for shared computers or sensitive environments

## Migration Strategy

Since `secrets` is optional in `SpaceSetup`, existing spaces will work unchanged. The field will be `undefined` until secrets are first saved.

## Implementation Priority

1. Add `secrets` field to `SpaceSetup` type
2. Implement database operations in `localDb.ts`
3. Update Space class methods to use database
4. Test with existing spaces
5. (Optional) Add encryption later if needed 