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

    // Join a space
    socket.on('join-space', async (spaceId: string) => {
      try {
        // Check if user can access this space
        if (!services.spaces.canUserAccessSpace(socket.userId, spaceId)) {
          socket.emit('error', { message: 'Access denied to space', code: 'ACCESS_DENIED' });
          return;
        }

        // Join the space room
        await socket.join(`space-${spaceId}`);
        
        // Notify others in the space
        socket.to(`space-${spaceId}`).emit('user-joined-space', {
          userId: socket.userId,
          userName: socket.userName,
          spaceId,
          timestamp: new Date().toISOString()
        });

        // Confirm join to the user
        socket.emit('joined-space', { spaceId });
        
        console.log(`📍 ${socket.userName} joined space: ${spaceId}`);
      } catch (error) {
        console.error('Error joining space:', error);
        socket.emit('error', { message: 'Failed to join space', code: 'JOIN_SPACE_FAILED' });
      }
    });

    // Leave a space
    socket.on('leave-space', async (spaceId: string) => {
      try {
        await socket.leave(`space-${spaceId}`);
        
        // Notify others in the space
        socket.to(`space-${spaceId}`).emit('user-left-space', {
          userId: socket.userId,
          userName: socket.userName,
          spaceId,
          timestamp: new Date().toISOString()
        });

        socket.emit('left-space', { spaceId });
        console.log(`📍 ${socket.userName} left space: ${spaceId}`);
      } catch (error) {
        console.error('Error leaving space:', error);
        socket.emit('error', { message: 'Failed to leave space', code: 'LEAVE_SPACE_FAILED' });
      }
    });

    // Send message to space
    socket.on('send-message', (data: { spaceId: string; message: string; type?: string }) => {
      try {
        const { spaceId, message, type = 'text' } = data;

        // Check if user can access this space
        if (!services.spaces.canUserAccessSpace(socket.userId, spaceId)) {
          socket.emit('error', { message: 'Access denied to space', code: 'ACCESS_DENIED' });
          return;
        }

        const messageData = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          spaceId,
          userId: socket.userId,
          userName: socket.userName,
          userEmail: socket.userEmail,
          message,
          type,
          timestamp: new Date().toISOString()
        };

        // Broadcast to all users in the space (including sender)
        io.to(`space-${spaceId}`).emit('new-message', messageData);
        
        console.log(`💬 Message in space ${spaceId} from ${socket.userName}: ${message.substring(0, 50)}...`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message', code: 'SEND_MESSAGE_FAILED' });
      }
    });

    // Space operations sync (for collaborative editing)
    socket.on('space-operation', (data: { spaceId: string; operation: any }) => {
      try {
        const { spaceId, operation } = data;

        // Check if user can access this space
        if (!services.spaces.canUserAccessSpace(socket.userId, spaceId)) {
          socket.emit('error', { message: 'Access denied to space', code: 'ACCESS_DENIED' });
          return;
        }

        // Broadcast operation to all other users in the space (not sender)
        socket.to(`space-${spaceId}`).emit('space-operation-received', {
          spaceId,
          operation,
          fromUserId: socket.userId,
          fromUserName: socket.userName,
          timestamp: new Date().toISOString()
        });

        console.log(`🔄 Space operation in ${spaceId} from ${socket.userName}`);
      } catch (error) {
        console.error('Error processing space operation:', error);
        socket.emit('error', { message: 'Failed to process operation', code: 'OPERATION_FAILED' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (data: { spaceId: string }) => {
      socket.to(`space-${data.spaceId}`).emit('user-typing', {
        userId: socket.userId,
        userName: socket.userName,
        spaceId: data.spaceId
      });
    });

    socket.on('typing-stop', (data: { spaceId: string }) => {
      socket.to(`space-${data.spaceId}`).emit('user-stopped-typing', {
        userId: socket.userId,
        userName: socket.userName,
        spaceId: data.spaceId
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason: string) => {
      console.log(`🔌 User disconnected: ${socket.userName} (${reason})`);
      
      // You could notify all spaces the user was in that they left
      // This would require tracking which spaces each socket is in
    });

    // Get active users in a space
    socket.on('get-space-users', async (spaceId: string) => {
      try {
        if (!services.spaces.canUserAccessSpace(socket.userId, spaceId)) {
          socket.emit('error', { message: 'Access denied to space', code: 'ACCESS_DENIED' });
          return;
        }

        const room = io.sockets.adapter.rooms.get(`space-${spaceId}`);
        const activeUsers = [];
        
        if (room) {
          for (const socketId of room) {
            const userSocket = io.sockets.sockets.get(socketId) as any;
            if (userSocket) {
              activeUsers.push({
                userId: userSocket.userId,
                userName: userSocket.userName,
                userEmail: userSocket.userEmail
              });
            }
          }
        }

        socket.emit('space-users', { spaceId, users: activeUsers });
      } catch (error) {
        console.error('Error getting space users:', error);
        socket.emit('error', { message: 'Failed to get space users', code: 'GET_USERS_FAILED' });
      }
    });
  });

  console.log('🔌 Socket.IO server initialized');
  return io;
} 