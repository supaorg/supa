import { FastifyInstance } from 'fastify';
import { AuthService } from '../auth';

export function registerHealthRoutes(fastify: FastifyInstance, auth: AuthService, apiBaseUrl: string) {
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
        health: `${apiBaseUrl}/health`,
        login: `${apiBaseUrl}/auth/login/google`,
        me: `${apiBaseUrl}/auth/me`,
        refresh: `${apiBaseUrl}/auth/refresh`,
        logout: `${apiBaseUrl}/auth/logout`
      },
      mockUser: auth.isMockMode() ? {
        email: 'dev@dev.dev',
        name: 'Dev User',
        loginUrl: `${apiBaseUrl}/auth/login/google`
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
} 