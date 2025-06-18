import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { Services } from './services';
import { AuthError } from './auth';

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

    // Handle disconnection
    socket.on('disconnect', (reason: string) => {
      console.log(`🔌 User disconnected: ${socket.userName} (${reason})`);

      // You could notify all spaces the user was in that they left
      // This would require tracking which spaces each socket is in
    });

    socket.on('join-space', (data: { spaceId: string }) => {
      console.log(`🏠 User joined space: ${data.spaceId}`);
    });

    socket.on('leave-space', (data: { spaceId: string }) => {
      console.log(`🏠 User left space: ${data.spaceId}`);
    });
  });

  console.log('🔌 Socket.IO server initialized');
  return io;
} 