import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { Services } from './services';
import { AuthError } from './auth';
import type { VertexOperation } from "@core/index";

interface AuthenticatedSocket extends SocketIOServer {
  userId?: string;
  userEmail?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-not-for-production';

export function setupSocketIO(httpServer: HTTPServer, services: Services, frontendUrl: string) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: frontendUrl,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify JWT token
      const user = await services.auth.verifyToken(token);

      // Attach user info to socket
      socket.userId = user.id;
      socket.userEmail = user.email;
      socket.userName = user.name;

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: any) => {
    console.log(`🔌 User connected: ${socket.userName} (${socket.userId})`);

    // Track which spaces this socket has joined
    const joinedSpaces: Set<string> = new Set();

    // Handle disconnection
    socket.on('disconnect', (reason: string) => {
      console.log(`🔌 User disconnected: ${socket.userName} (${reason})`);
      for (const spaceId of joinedSpaces) {
        services.spaces.releaseConnection(spaceId);
      }
      joinedSpaces.clear();
    });

    socket.on('join-space', (data: { spaceId: string }) => {
      console.log(`🏠 User joined space: ${data.spaceId}`);

      // Join socket.io room for broadcasting
      socket.join(data.spaceId);

      // Acquire connection reference
      services.spaces.acquireConnection(data.spaceId).catch(console.error);
      joinedSpaces.add(data.spaceId);
    });

    socket.on('leave-space', (data: { spaceId: string }) => {
      console.log(`🏠 User left space: ${data.spaceId}`);

      socket.leave(data.spaceId);
      services.spaces.releaseConnection(data.spaceId);
      joinedSpaces.delete(data.spaceId);
    });

    // Handle vertex operations sync
    socket.on('sync-ops', async (data: { spaceId: string; treeId: string; ops: VertexOperation[] }) => {
      try {
        console.log(`🔄 Received ops sync from ${socket.userName} (${socket.userId})`, {
          spaceId: data.spaceId,
          treeId: data.treeId,
          numOps: data.ops.length,
        });

        // Load the space's ServerSpaceSync instance (creates/loads db/cache)
        const sync = await services.spaces.loadSpace(data.spaceId);

        // Append the operations to the appropriate tree
        await sync.appendTreeOps(data.treeId, data.ops);

        // Broadcast to other clients in the same space (optional)
        // socket.to(data.spaceId).emit('ops-applied', { treeId: data.treeId, ops: data.ops });
      } catch (err) {
        console.error('❌ Failed to process synced ops:', err);
      }
    });

    // Handle secrets sync
    socket.on('sync-secrets', async (data: { spaceId: string; secrets: Record<string, string> }) => {
      try {
        console.log(`🔄 Received secrets sync from ${socket.userName} (${socket.userId})`, {
          spaceId: data.spaceId,
          numSecrets: Object.keys(data.secrets || {}).length,
        });
        // TODO: Persist secrets securely, e.g., via services.spaceService.saveSecrets(...)
      } catch (err) {
        console.error('❌ Failed to process synced secrets:', err);
      }
    });
  });

  console.log('🔌 Socket.IO server initialized');
  return io;
} 