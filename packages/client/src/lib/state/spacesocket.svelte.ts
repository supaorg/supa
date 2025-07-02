import { browser } from "$app/environment";
import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "$lib/utils/api";
import { clientState } from "./clientState.svelte";
import type { VertexOperation } from "@core";

export class SpaceSocketStore {
  // Reactive state - same as SpaceEntry.svelte
  socket: Socket | null = $state(null);
  socketConnected: boolean = $state(false);
  
  // Private properties
  private pingInterval: NodeJS.Timeout | null = null;

  async setupSocketConnection() {
    if (!clientState.auth.isAuthenticated || this.socket) return;

    console.log("Setting up WebSocket connection...");

    // Get auth header (async)
    const authHeader = await clientState.auth.getAuthHeader();

    // Connect to server WebSocket
    this.socket = io(API_BASE_URL, {
      auth: {
        token: authHeader ? authHeader.replace("Bearer ", "") : undefined,
      },
    });

    // Connection successful
    this.socket.on("connect", () => {
      console.log("✅ WebSocket connected:", this.socket?.id);
      this.socketConnected = true;
    });

    // Connection failed/lost
    this.socket.on("disconnect", (reason) => {
      console.log("❌ WebSocket disconnected:", reason);
      this.socketConnected = false;
    });

    // Connection error
    this.socket.on("connect_error", (error) => {
      console.error("🔴 WebSocket connection error:", error);
      this.socketConnected = false;
    });

    // Simple ping/pong for connectivity testing
    this.socket.on("pong", (data) => {
      console.log("🏓 Pong received:", data);
    });

    // Send a test ping every 30 seconds
    this.pingInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit("ping", { timestamp: Date.now() });
        console.log("🏓 Ping sent");
      }
    }, 30000);
  }

  // Exact same function from SpaceEntry.svelte
  cleanupSocketConnection() {
    if (this.socket) {
      console.log("🧹 Cleaning up WebSocket connection");
      this.socket.disconnect();
      this.socket = null;
      this.socketConnected = false;
    }

    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

// Export singleton instance
export const spaceSocketStore = new SpaceSocketStore();

// === Placeholder server-sync helpers ===
// These will be fleshed out in upcoming server-sync work.

/**
 * Queue a batch of vertex operations to be synced with the remote server.
 */
export function queueOpsForSync(
  spaceId: string,
  treeId: string,
  ops: ReadonlyArray<VertexOperation>
): void {
  // If the socket connection is live, emit immediately. Otherwise, log a warning.
  if (spaceSocketStore.socket && spaceSocketStore.socket.connected) {
    spaceSocketStore.socket.emit("sync-ops", { spaceId, treeId, ops });
    console.log("🚀 Sent ops for sync:", { spaceId, treeId, ops });
  } else {
    throw new Error("Socket not connected or not authenticated, cannot sync ops");
  }
}

/**
 * Queue a collection of secrets to be synced with the remote server.
 */
export function queueSecretsForSync(
  spaceId: string,
  secrets: Record<string, string>
): void {
  if (spaceSocketStore.socket && spaceSocketStore.socket.connected) {
    spaceSocketStore.socket.emit("sync-secrets", { spaceId, secrets });
    console.log("🚀 Sent secrets for sync:", { spaceId, secrets });
  } else {
    throw new Error("Socket not connected or not authenticated, cannot sync secrets");
  }
} 