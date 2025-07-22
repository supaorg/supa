import type { VertexOperation } from "reptree";

/**
 * Interface for persistence layers that handle space and app tree operations.
 * Supports both one-way (write-only) and two-way (bidirectional) sync models.
 */
export interface PersistenceLayer {
  // Lifecycle
  connect(): Promise<void>
  isConnected(): boolean
  disconnect(): Promise<void>
  
  // Multi-tree support - handles both space tree and app trees
  loadSpaceTreeOps(): Promise<VertexOperation[]>
  saveTreeOps(treeId: string, ops: ReadonlyArray<VertexOperation>): Promise<void>
  
  // Tree loader callback for lazy loading AppTrees
  loadTreeOps(treeId: string): Promise<VertexOperation[]>
  
  // Secrets management
  loadSecrets(): Promise<Record<string, string> | undefined>
  saveSecrets(secrets: Record<string, string>): Promise<void>
  
  // Optional: for two-way sync layers
  startListening?(onIncomingOps: (treeId: string, ops: VertexOperation[]) => void): Promise<void>
  stopListening?(): Promise<void>
  
  // Metadata
  readonly id: string
  readonly type: 'local' | 'remote'
} 