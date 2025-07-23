import type { VertexOperation } from "@supa/core";
import {
  newMoveVertexOp,
  newSetVertexPropertyOp
} from "@supa/core";

export type ParsedOp = {
  type: 'm' | 'p';
  counter: number;
  peerId: string;
  targetId: string;
  parentId?: string;
  key?: string;
  value?: any;
};

type PendingRequest = {
  resolve: (ops: VertexOperation[]) => void;
  reject: (error: Error) => void;
};

/**
 * Handles parsing of JSONL operation lines using a Web Worker.
 * Manages request-response correlation to avoid race conditions.
 */
export class OpsParser {
  private worker: Worker;
  private pendingRequests = new Map<string, PendingRequest>();
  private readonly timeoutMs: number;

  constructor(timeoutMs: number = 10000) {
    this.timeoutMs = timeoutMs;
    this.worker = new Worker(new URL('./opsParser.worker.ts', import.meta.url));
    this.setupWorkerMessageHandler();
  }

  private setupWorkerMessageHandler(): void {
    this.worker.addEventListener('message', (e: MessageEvent) => {
      const { requestId, operations, error } = e.data;
      const pending = this.pendingRequests.get(requestId);
      
      if (!pending) {
        console.warn('Received response for unknown request:', requestId);
        return;
      }
      
      this.pendingRequests.delete(requestId);
      
      if (error) {
        pending.reject(new Error(error));
      } else {
        const vertexOps = operations.map((op: ParsedOp) => {
          if (op.type === 'm') {
            return newMoveVertexOp(op.counter, op.peerId, op.targetId, op.parentId ?? null);
          } else {
            // Convert empty object ({}) to undefined
            const value = op.value && typeof op.value === 'object' && Object.keys(op.value).length === 0 ? undefined : op.value;
            return newSetVertexPropertyOp(op.counter, op.peerId, op.targetId, op.key!, value);
          }
        });
        pending.resolve(vertexOps);
      }
    });
  }

  /**
   * Parse JSONL lines into VertexOperation objects.
   * @param lines - Array of JSONL strings to parse
   * @param peerId - The peer ID to associate with the operations
   * @returns Promise that resolves to an array of VertexOperation objects
   */
  async parseLines(lines: string[], peerId: string): Promise<VertexOperation[]> {
    const requestId = crypto.randomUUID();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Operation parsing timed out'));
      }, this.timeoutMs);

      this.pendingRequests.set(requestId, {
        resolve: (ops: VertexOperation[]) => {
          clearTimeout(timeout);
          resolve(ops);
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        }
      });

      this.worker.postMessage({ lines, peerId, requestId });
    });
  }

  /**
   * Terminate the worker and clean up resources.
   */
  destroy(): void {
    this.worker.terminate();
    
    // Reject all pending requests
    for (const [requestId, pending] of this.pendingRequests.entries()) {
      pending.reject(new Error('OpsParser destroyed'));
    }
    this.pendingRequests.clear();
  }

  /**
   * Get the number of pending requests (useful for debugging).
   */
  get pendingRequestCount(): number {
    return this.pendingRequests.size;
  }
} 