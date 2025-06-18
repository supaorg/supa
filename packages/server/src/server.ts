import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Database } from './database';
import { AuthError } from './auth';
import { createServices } from './services';
import { registerAuthRoutes } from './routes/auth.routes';
import { registerHealthRoutes } from './routes/health.routes';
import { registerSpaceRoutes } from './routes/space.routes';

// Use cloud-provided PORT or default for development
const PORT = parseInt(process.env.PORT || '3131', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:6969';
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}`;

// Initialize database and services
const db = new Database('./data/platform.db');
const services = createServices(db);

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

// Register routes
registerAuthRoutes(fastify, services.auth, FRONTEND_URL);
registerHealthRoutes(fastify, services.auth, API_BASE_URL);
registerSpaceRoutes(fastify, services);

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

    if (services.auth.isMockMode()) {
      fastify.log.info(`🔧 MOCK AUTH MODE - Visit ${API_BASE_URL}/dev/info for details`);
      fastify.log.info(`   Quick test: ${API_BASE_URL}/auth/login/google`);
    }
  } catch (error) {
    fastify.log.error('Error starting server:', error);
    process.exit(1);
  }
};

start(); 