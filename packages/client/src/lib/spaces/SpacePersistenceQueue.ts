import type { VertexOperation } from "reptree";
import { getTreeOps, appendTreeOps, getAllSecrets, saveAllSecrets } from "$lib/localDb";

/**
 * A queue that manages operations and secrets that need to be saved to the database.
 * Handles both tree operations and space secrets persistence.
 */
export default class SpacePersistenceQueue {
  private opsMap: Map<string, VertexOperation[]> = new Map();
  private secretsToSave: Record<string, string> = {};
  private spaceId: string;
  private savingOpsToDatabase = false;
  private savingSecretsToDatabase = false;

  constructor(spaceId: string) {
    this.spaceId = spaceId;
  }

  // === Tree Operations Management ===

  addOps(treeId: string, ops: ReadonlyArray<VertexOperation>): void {
    const existingOps = this.opsMap.get(treeId) || [];
    this.opsMap.set(treeId, [...existingOps, ...ops]);
  }

  async getSavedOps(treeId: string): Promise<VertexOperation[]> {
    return await getTreeOps(this.spaceId, treeId);
  }

  private async saveOps(): Promise<void> {
    if (this.savingOpsToDatabase) return;
    if (this.opsMap.size === 0) return;

    this.savingOpsToDatabase = true;

    // Get all entries to process
    const entriesToSave = Array.from(this.opsMap.entries());

    try {
      await Promise.all(
        entriesToSave.map(async ([treeId, ops]) => {
          if (ops.length > 0) {
            // Clear ops immediately before saving
            this.opsMap.delete(treeId);
            
            try {
              await appendTreeOps(this.spaceId, treeId, ops);
            } catch (error) {
              // Re-add ops back to queue if save failed
              const existingOps = this.opsMap.get(treeId) || [];
              this.opsMap.set(treeId, [...ops, ...existingOps]);
              console.error(`Failed to save ops for tree ${treeId}:`, error);
            }
          }
        })
      );
    } catch (error) {
      console.error("Failed to save ops:", error);
    } finally {
      this.savingOpsToDatabase = false;
    }
  }

  // === Secrets Management ===

  addSecret(key: string, value: string): void {
    this.secretsToSave[key] = value;
  }

  async getSavedSecrets(): Promise<Record<string, string>> {
    const secrets = await getAllSecrets(this.spaceId);
    return secrets || {};
  }

  private async saveSecrets(): Promise<void> {
    if (this.savingSecretsToDatabase) return;
    if (Object.keys(this.secretsToSave).length === 0) return;

    this.savingSecretsToDatabase = true;

    // Take a snapshot but don't clear yet
    const secretsToSave = { ...this.secretsToSave };

    try {
      await saveAllSecrets(this.spaceId, secretsToSave);
      
      // Only clear if save was successful
      this.secretsToSave = {};
    } catch (error) {
      console.error("Failed to save secrets:", error);
      // Secrets remain in the queue for next attempt
    } finally {
      this.savingSecretsToDatabase = false;
    }
  }

  // === Public Save Interface ===

  /**
   * Save all pending data (operations and secrets) to the database.
   * This should be called by the consumer at appropriate times (e.g., end of frame).
   */
  async saveData(): Promise<void> {
    await Promise.all([this.saveOps(), this.saveSecrets()]);
  }

  // === Status Getters ===

  get hasPendingOps(): boolean {
    return this.opsMap.size > 0;
  }

  get hasPendingSecrets(): boolean {
    return Object.keys(this.secretsToSave).length > 0;
  }

  get hasPendingData(): boolean {
    return this.hasPendingOps || this.hasPendingSecrets;
  }

  get isSaving(): boolean {
    return this.savingOpsToDatabase || this.savingSecretsToDatabase;
  }
}