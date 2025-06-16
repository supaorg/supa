import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Database } from './database.js';
import { AuthService } from './auth.js';

const PORT = parseInt(process.env.PORT || '3131');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:6969';

// Initialize database and auth service
const db = new Database('./data/t69.db');
const auth = new AuthService(db);

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  }
});

// Register CORS plugin
await fastify.register(cors, {
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS']
});

// Types for request/response
interface AuthMeRequest {
  Headers: {
    authorization?: string;
  };
}

interface GoogleCallbackRequest {
  Querystring: {
    code?: string;
    error?: string;
  };
}

// Helper to extract JWT token from Authorization header
function getAuthToken(authorization?: string): string | null {
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.substring(7);
  }
  return null;
}

// Routes

// Health check
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };
});

// Start Google OAuth flow
fastify.get('/auth/login/google', async (request, reply) => {
  const authUrl = auth.getGoogleAuthUrl();
  return reply.redirect(302, authUrl);
});

// Handle Google OAuth callback
fastify.get<{ Querystring: GoogleCallbackRequest['Querystring'] }>(
  '/auth/callback/google', 
  async (request, reply) => {
    const { code, error } = request.query;
    
    if (error) {
      return reply.redirect(302, `${FRONTEND_URL}/auth/callback?error=${error}`);
    }
    
    if (!code) {
      return reply.redirect(302, `${FRONTEND_URL}/auth/callback?error=missing_code`);
    }

    try {
      const token = await auth.handleGoogleCallback(code);
      return reply.redirect(302, `${FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      fastify.log.error('Google callback error:', error);
      return reply.redirect(302, `${FRONTEND_URL}/auth/callback?error=auth_failed`);
    }
  }
);

// Get current user info
fastify.get<{ Headers: AuthMeRequest['Headers'] }>(
  '/auth/me',
  async (request, reply) => {
    const token = getAuthToken(request.headers.authorization);
    
    if (!token) {
      return reply.code(401).send({ error: 'No token provided' });
    }

    try {
      const user = await auth.verifyToken(token);
      return { user };
    } catch (error) {
      return reply.code(401).send({ error: 'Invalid token' });
    }
  }
);

// Logout (for JWT, this is mainly client-side)
fastify.post('/auth/logout', async (request, reply) => {
  // For JWT tokens, logout is handled client-side by removing the token
  // We could implement token blacklisting here if needed in the future
  return { success: true };
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  
  // Send error response
  reply.code(500).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  fastify.log.info(`Received ${signal}, shutting down gracefully...`);
  
  try {
    await fastify.close();
    db.close();
    fastify.log.info('Server closed successfully');
    process.exit(0);
  } catch (error) {
    fastify.log.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Register shutdown handlers
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start server
const start = async () => {
  try {
    await fastify.listen({ 
      port: PORT, 
      host: '0.0.0.0' // Listen on all interfaces
    });
    
    fastify.log.info(`🚀 Server running on http://localhost:${PORT}`);
    fastify.log.info(`📱 Frontend URL: ${FRONTEND_URL}`);
  } catch (error) {
    fastify.log.error('Error starting server:', error);
    process.exit(1);
  }
};

start(); 