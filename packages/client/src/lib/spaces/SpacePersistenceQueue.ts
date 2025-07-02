import type { VertexOperation } from "@core";
import { getTreeOps, appendTreeOps, getAllSecrets, saveAllSecrets } from "$lib/localDb";
// Placeholder helpers for future server sync (not yet implemented)
import { queueOpsForSync, queueSecretsForSync } from "$lib/state/spacesocket.svelte";

/**
 * A queue that manages operations and secrets that need to be saved locally and synced remotely.
 * Uses separate queues for local persistence vs remote sync for better failure handling and performance.
 */
export default class SpacePersistenceQueue {
  // === Local Queues ===
  private localOpsMap: Map<string, VertexOperation[]> = new Map();
  private localSecretsToSave: Record<string, string> = {};
  private savingLocalOps = false;
  private savingLocalSecrets = false;

  // === Remote Queues ===
  private remoteOpsMap: Map<string, VertexOperation[]> = new Map();
  private remoteSecretsToSync: Record<string, string> = {};
  private syncingRemoteOps = false;
  private syncingRemoteSecrets = false;

  private spaceId: string;
  private uri?: string;
  private isLocal: boolean;

  constructor(spaceId: string, uri?: string) {
    this.spaceId = spaceId;
    this.uri = uri;

    this.isLocal = !uri || !uri.startsWith('http');
  }

  // === Tree Operations Management ===

  addOps(treeId: string, ops: ReadonlyArray<VertexOperation>): void {
    // Add to both local and remote queues
    const existingLocalOps = this.localOpsMap.get(treeId) || [];
    const existingRemoteOps = this.remoteOpsMap.get(treeId) || [];
    
    this.localOpsMap.set(treeId, [...existingLocalOps, ...ops]);

    if (!this.isLocal) {
      this.remoteOpsMap.set(treeId, [...existingRemoteOps, ...ops]);
    }
  }

  private async saveLocalOps(): Promise<void> {
    if (this.savingLocalOps) return;
    if (this.localOpsMap.size === 0) return;

    this.savingLocalOps = true;

    // Get all entries to process
    const entriesToSave = Array.from(this.localOpsMap.entries());

    try {
      await Promise.all(
        entriesToSave.map(async ([treeId, ops]) => {
          if (ops.length > 0) {
            // Clear ops immediately before saving
            this.localOpsMap.delete(treeId);

            try {
              await appendTreeOps(this.spaceId, treeId, ops);
            } catch (error) {
              // Re-add ops back to LOCAL queue only if save failed
              const existingOps = this.localOpsMap.get(treeId) || [];
              this.localOpsMap.set(treeId, [...ops, ...existingOps]);
              console.error(`Failed to save ops locally for tree ${treeId}:`, error);
            }
          }
        })
      );
    } catch (error) {
      console.error("Failed to save local ops:", error);
    } finally {
      this.savingLocalOps = false;
    }
  }

  private async syncRemoteOps(): Promise<void> {
    if (this.syncingRemoteOps) return;
    if (this.remoteOpsMap.size === 0) return;

    this.syncingRemoteOps = true;

    // Get all entries to process
    const entriesToSync = Array.from(this.remoteOpsMap.entries());

    try {
      await Promise.all(
        entriesToSync.map(async ([treeId, ops]) => {
          if (ops.length > 0) {
            // Clear ops immediately before syncing
            this.remoteOpsMap.delete(treeId);

            try {
              queueOpsForSync(this.spaceId, treeId, ops);
            } catch (error) {
              // Re-add ops back to REMOTE queue only if sync failed
              const existingOps = this.remoteOpsMap.get(treeId) || [];
              this.remoteOpsMap.set(treeId, [...ops, ...existingOps]);
              console.error(`Failed to sync ops remotely for tree ${treeId}:`, error);
            }
          }
        })
      );
    } catch (error) {
      console.error("Failed to sync remote ops:", error);
    } finally {
      this.syncingRemoteOps = false;
    }
  }

  // === Secrets Management ===

  addSecret(key: string, value: string): void {
    // Add to both local and remote queues
    this.localSecretsToSave[key] = value;
    
    if (!this.isLocal) {
      this.remoteSecretsToSync[key] = value;
    }
  }

  async getSavedSecrets(): Promise<Record<string, string>> {
    const secrets = await getAllSecrets(this.spaceId);
    return secrets || {};
  }

  private async saveLocalSecrets(): Promise<void> {
    if (this.savingLocalSecrets) return;
    if (Object.keys(this.localSecretsToSave).length === 0) return;

    this.savingLocalSecrets = true;

    // Take a snapshot but don't clear yet
    const secretsToSave = { ...this.localSecretsToSave };

    try {
      await saveAllSecrets(this.spaceId, secretsToSave);

      // Only clear local queue if save was successful
      this.localSecretsToSave = {};
    } catch (error) {
      console.error("Failed to save secrets locally:", error);
      // Secrets remain in the local queue for next attempt
    } finally {
      this.savingLocalSecrets = false;
    }
  }

  private async syncRemoteSecrets(): Promise<void> {
    if (this.syncingRemoteSecrets) return;
    if (Object.keys(this.remoteSecretsToSync).length === 0) return;

    this.syncingRemoteSecrets = true;

    // Take a snapshot but don't clear yet
    const secretsToSync = { ...this.remoteSecretsToSync };

    try {
      queueSecretsForSync(this.spaceId, secretsToSync);

      // Only clear remote queue if sync was successful
      this.remoteSecretsToSync = {};
    } catch (error) {
      console.error("Failed to sync secrets remotely:", error);
      // Secrets remain in the remote queue for next attempt
    } finally {
      this.syncingRemoteSecrets = false;
    }
  }

  // === Private Save Methods ===

  private async saveData(): Promise<void> {
    // Save local and remote independently
    await Promise.all([
      this.saveLocalOps(),
      this.saveLocalSecrets(),
      this.syncRemoteOps(), 
      this.syncRemoteSecrets()
    ]);
  }

  // === Public Interface ===

  /**
   * Save all pending local data to the database.
   * This provides immediate persistence for optimistic UI updates.
   */
  async saveLocal(): Promise<void> {
    await Promise.all([this.saveLocalOps(), this.saveLocalSecrets()]);
  }

  /**
   * Sync all pending remote data to the server.
   * This can be called less frequently or batched for performance.
   */
  async syncRemote(): Promise<void> {
    await Promise.all([this.syncRemoteOps(), this.syncRemoteSecrets()]);
  }

  /**
   * Save both local and remote data.
   * For backward compatibility with existing code.
   */
  async saveAll(): Promise<void> {
    await this.saveData();
  }

  // === Status Getters ===

  get hasPendingLocalOps(): boolean {
    return this.localOpsMap.size > 0;
  }

  get hasPendingRemoteOps(): boolean {
    return this.remoteOpsMap.size > 0;
  }

  get hasPendingLocalSecrets(): boolean {
    return Object.keys(this.localSecretsToSave).length > 0;
  }

  get hasPendingRemoteSecrets(): boolean {
    return Object.keys(this.remoteSecretsToSync).length > 0;
  }

  get hasPendingLocal(): boolean {
    return this.hasPendingLocalOps || this.hasPendingLocalSecrets;
  }

  get hasPendingRemote(): boolean {
    return this.hasPendingRemoteOps || this.hasPendingRemoteSecrets;
  }

  get hasPendingData(): boolean {
    return this.hasPendingLocal || this.hasPendingRemote;
  }

  get isSavingLocal(): boolean {
    return this.savingLocalOps || this.savingLocalSecrets;
  }

  get isSyncingRemote(): boolean {
    return this.syncingRemoteOps || this.syncingRemoteSecrets;
  }

  get isSaving(): boolean {
    return this.isSavingLocal || this.isSyncingRemote;
  }
}