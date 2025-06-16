import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Database } from './database';
import { AuthService, AuthError } from './auth';

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
    state?: string;
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

// Health check with auth status
fastify.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    auth: {
      mode: auth.isMockMode() ? 'mock' : 'oauth',
      mockUser: auth.isMockMode() ? 'dev@t69.local' : null
    }
  };
});

// Development info endpoint
fastify.get('/dev/info', async (request, reply) => {
  if (process.env.NODE_ENV === 'production') {
    return reply.code(404).send({ error: 'Not found' });
  }

  return {
    mode: auth.isMockMode() ? 'mock' : 'oauth',
    mockMode: auth.isMockMode(),
    endpoints: {
      health: `http://localhost:${PORT}/health`,
      login: `http://localhost:${PORT}/auth/login/google`,
      me: `http://localhost:${PORT}/auth/me`,
      refresh: `http://localhost:${PORT}/auth/refresh`,
      logout: `http://localhost:${PORT}/auth/logout`
    },
    mockUser: auth.isMockMode() ? {
      email: 'dev@t69.local',
      name: 'Dev User',
      loginUrl: `http://localhost:${PORT}/auth/login/google`
    } : null,
    setup: auth.isMockMode() ? {
      message: 'Running in mock mode - no OAuth setup required!',
      toEnableOAuth: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables'
    } : {
      message: 'Running with real OAuth',
      configured: true
    }
  };
});

// Start Google OAuth flow
fastify.get('/auth/login/google', async (request, reply) => {
  try {
    const authUrl = auth.getGoogleAuthUrl();
    return reply.redirect(authUrl, 302);
  } catch (error) {
    if (error instanceof AuthError) {
      return reply.code(error.statusCode).send({
        error: error.message,
        code: error.code
      });
    }
    throw error;
  }
});

// Handle Google OAuth callback
fastify.get<{ Querystring: GoogleCallbackRequest['Querystring'] }>(
  '/auth/callback/google',
  async (request, reply) => {
    const { code, error, state } = request.query;

    if (error) {
      return reply.redirect(`${FRONTEND_URL}/auth/callback?error=${error}`, 302);
    }

    if (!code) {
      return reply.redirect(`${FRONTEND_URL}/auth/callback?error=missing_code`, 302);
    }

    try {
      const token = await auth.handleGoogleCallback(code);
      const redirectUrl = state
        ? `${FRONTEND_URL}/auth/callback?token=${token}&state=${state}`
        : `${FRONTEND_URL}/auth/callback?token=${token}`;
      return reply.redirect(redirectUrl, 302);
    } catch (error) {
      if (error instanceof AuthError) {
        fastify.log.error('Google callback error:', {
          message: error.message,
          code: error.code
        });
        return reply.redirect(`${FRONTEND_URL}/auth/callback?error=${error.code}`, 302);
      }
      fastify.log.error('Unexpected Google callback error:', error);
      return reply.redirect(`${FRONTEND_URL}/auth/callback?error=auth_failed`, 302);
    }
  }
);

// Get current user info
fastify.get<{ Headers: AuthMeRequest['Headers'] }>(
  '/auth/me',
  async (request, reply) => {
    const token = getAuthToken(request.headers.authorization);

    if (!token) {
      return reply.code(401).send({ error: 'No token provided', code: 'NO_TOKEN' });
    }

    try {
      const user = await auth.verifyToken(token);
      return {
        user,
        meta: {
          mockMode: auth.isMockMode()
        }
      };
    } catch (error) {
      if (error instanceof AuthError) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code
        });
      }
      return reply.code(401).send({ error: 'Token verification failed', code: 'TOKEN_FAILED' });
    }
  }
);

// Refresh user data
fastify.post<{ Headers: AuthMeRequest['Headers'] }>(
  '/auth/refresh',
  async (request, reply) => {
    const token = getAuthToken(request.headers.authorization);

    if (!token) {
      return reply.code(401).send({ error: 'No token provided', code: 'NO_TOKEN' });
    }

    try {
      const currentUser = await auth.verifyToken(token);
      const refreshedUser = await auth.refreshUserData(currentUser.id);

      if (!refreshedUser) {
        return reply.code(404).send({ error: 'User not found', code: 'USER_NOT_FOUND' });
      }

      return {
        user: refreshedUser,
        meta: {
          mockMode: auth.isMockMode(),
          refreshed: !auth.isMockMode()
        }
      };
    } catch (error) {
      if (error instanceof AuthError) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code
        });
      }
      return reply.code(500).send({ error: 'Refresh failed', code: 'REFRESH_FAILED' });
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

  // Handle AuthError specifically
  if (error instanceof AuthError) {
    return reply.code(error.statusCode).send({
      error: error.message,
      code: error.code
    });
  }

  // Send generic error response
  reply.code(500).send({
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
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

    if (auth.isMockMode()) {
      fastify.log.info(`🔧 MOCK AUTH MODE - Visit http://localhost:${PORT}/dev/info for details`);
      fastify.log.info(`   Quick test: http://localhost:${PORT}/auth/login/google`);
    }
  } catch (error) {
    fastify.log.error('Error starting server:', error);
    process.exit(1);
  }
};

start(); 