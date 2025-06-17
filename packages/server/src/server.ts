import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Database } from './database';
import { AuthService, AuthError } from './auth';

// Use cloud-provided PORT or default for development
const PORT = parseInt(process.env.PORT || '3131', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:6969';
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}`;

// Initialize database and auth service
const db = new Database('./data/platform.db');
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
      mockUser: auth.isMockMode() ? 'dev@dev.dev' : null
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
      health: `${API_BASE_URL}/health`,
      login: `${API_BASE_URL}/auth/login/google`,
      me: `${API_BASE_URL}/auth/me`,
      refresh: `${API_BASE_URL}/auth/refresh`,
      logout: `${API_BASE_URL}/auth/logout`
    },
    mockUser: auth.isMockMode() ? {
      email: 'dev@dev.dev',
      name: 'Dev User',
      loginUrl: `${API_BASE_URL}/auth/login/google`
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
fastify.get<{ Querystring: { code: string; error?: string; state?: string } }>(
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
      const tokens = await auth.handleGoogleCallback(code);
      
      // Create URL with all tokens
      const params = new URLSearchParams({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in.toString()
      });
      
      // Add state if present
      if (state) {
        params.set('state', state);
      }
      
      const redirectUrl = `${FRONTEND_URL}/auth/callback?${params.toString()}`;
      return reply.redirect(redirectUrl, 302);
    } catch (error) {
      console.error("Google callback error:", error);
      if (error instanceof Error && error.message === "Invalid token") {
        return reply.redirect(`${FRONTEND_URL}/auth/callback?error=invalid_token`, 302);
      }
      return reply.redirect(`${FRONTEND_URL}/auth/callback?error=auth_failed`, 302);
    }
  }
);

// Google OAuth callback (POST version for direct API calls)
fastify.post("/auth/callback", async (request, reply) => {
  const { code } = request.body as { code: string };
  if (!code) {
    return reply.status(400).send({ error: "Missing code" });
  }

  try {
    const tokens = await auth.handleGoogleCallback(code);
    return reply.send(tokens);
  } catch (error) {
    console.error("Google callback error:", error);
    if (error instanceof Error && error.message === "Invalid token") {
      return reply.status(401).send({ error: "Invalid token" });
    }
    return reply.status(500).send({ error: "Authentication failed" });
  }
});

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

// Refresh token endpoint
fastify.post("/auth/refresh", async (request, reply) => {
  const { refresh_token } = request.body as { refresh_token: string };
  if (!refresh_token) {
    return reply.status(400).send({ error: "Missing refresh token" });
  }

  try {
    const tokens = await auth.refreshTokens(refresh_token);
    return reply.send(tokens);
  } catch (error) {
    console.error("Token refresh error:", error);
    if (error instanceof Error && error.message === "Invalid token") {
      return reply.status(401).send({ error: "Invalid token" });
    }
    return reply.status(500).send({ error: "Token refresh failed" });
  }
});

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
      fastify.log.info(`🔧 MOCK AUTH MODE - Visit ${API_BASE_URL}/dev/info for details`);
      fastify.log.info(`   Quick test: ${API_BASE_URL}/auth/login/google`);
    }
  } catch (error) {
    fastify.log.error('Error starting server:', error);
    process.exit(1);
  }
};

start(); 