import { Database, SpaceMetadata } from '../database';
import { createNewServerSpaceSync, loadExistingServerSpaceSync, ServerSpaceSync } from '../lib/ServerSpaceSync';
import fs from 'fs';
import path from 'path';

export class SpaceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'SpaceError';
  }
}

export class SpaceService {
  constructor(private db: Database) { }

  /**
   * Create a new space with metadata and ServerSpaceSync
   */
  async createSpace(ownerId: string): Promise<{
    metadata: SpaceMetadata;
    sync: ServerSpaceSync;
  }> {
    let spaceId: string | undefined;

    try {
      // Create new space with ServerSpaceSync
      const sync = await createNewServerSpaceSync();
      spaceId = sync.space.getId();

      // Create space metadata in platform database
      const metadata = this.db.createSpaceMetadata(spaceId, ownerId);

      return { metadata, sync };
    } catch (error) {
      // Clean up metadata if sync creation failed
      try {
        if (spaceId) {
          this.db.deleteSpaceMetadata(spaceId);
        }
      } catch (cleanupError) {
        console.error('Failed to cleanup space metadata after sync creation failure:', cleanupError);
      }
      throw new SpaceError('Failed to create space', 'SPACE_CREATION_FAILED', 500);
    }
  }

  /**
   * Get space metadata by ID
   */
  getSpace(spaceId: string): SpaceMetadata | null {
    return this.db.getSpaceMetadata(spaceId);
  }

  /**
   * List all spaces for a user
   */
  listUserSpaces(userId: string): SpaceMetadata[] {
    return this.db.listUserSpaces(userId);
  }

  /**
   * Update space metadata
   */
  updateSpace(spaceId: string, updates: Partial<Pick<SpaceMetadata, 'name'>>): void {
    const space = this.getSpace(spaceId);
    if (!space) {
      throw new SpaceError('Space not found', 'SPACE_NOT_FOUND', 404);
    }

    this.db.updateSpaceMetadata(spaceId, updates);
  }

  /**
   * Delete space and all associated data
   */
  async deleteSpace(spaceId: string): Promise<void> {
    const space = this.getSpace(spaceId);
    if (!space) {
      throw new SpaceError('Space not found', 'SPACE_NOT_FOUND', 404);
    }

    try {
      // Delete space database file
      const dataDir = './data/spaces';
      const partitionDir = path.join(dataDir, spaceId.substring(0, 2));
      const dbPath = path.join(partitionDir, `${spaceId}.db`);

      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }

      // Delete metadata from platform database
      this.db.deleteSpaceMetadata(spaceId);
    } catch (error) {
      console.error('Failed to delete space:', error);
      throw new SpaceError('Failed to delete space', 'SPACE_DELETION_FAILED', 500);
    }
  }

  /**
   * Check if user can access space (for now, just check ownership)
   */
  canUserAccessSpace(userId: string, spaceId: string): boolean {
    const space = this.getSpace(spaceId);
    return space?.owner_id === userId;
  }

  /**
   * Check if user owns the space
   */
  isSpaceOwner(userId: string, spaceId: string): boolean {
    return this.canUserAccessSpace(userId, spaceId);
  }

  /**
   * Load existing space with ServerSpaceSync
   */
  async loadSpace(spaceId: string): Promise<ServerSpaceSync> {
    const space = this.getSpace(spaceId);
    if (!space) {
      throw new SpaceError('Space not found', 'SPACE_NOT_FOUND', 404);
    }

    try {
      return await loadExistingServerSpaceSync(spaceId);
    } catch (error) {
      console.error('Failed to load space:', error);
      throw new SpaceError('Failed to load space', 'SPACE_LOAD_FAILED', 500);
    }
  }
} 