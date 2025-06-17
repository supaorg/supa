import { FastifyInstance } from 'fastify';
import { AuthService } from '../auth';
import { createAuthMiddleware } from '../middleware/auth.middleware';

// Types
interface Space {
  id: string;
  created_at: number;
  owner_id: string;
}

export class SpaceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'SpaceError';
  }
}

export function registerSpaceRoutes(fastify: FastifyInstance, auth: AuthService) {
  const authMiddleware = createAuthMiddleware(auth);

  // Create a new space
  fastify.post('/spaces', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    try {
      // TODO: Implement actual space creation logic
      const space: Space = {
        id: 'dummy-id-' + Date.now(),
        created_at: Date.now(),
        owner_id: request.user!.id
      };

      return reply.code(201).send(space);
    } catch (error) {
      if (error instanceof SpaceError) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code
        });
      }
      throw error;
    }
  });

  // Get space by ID
  fastify.get<{ Params: { id: string } }>('/spaces/:id', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      // TODO: Implement actual space retrieval logic
      const space: Space = {
        id,
        created_at: Date.now(),
        owner_id: request.user!.id
      };

      return reply.send(space);
    } catch (error) {
      if (error instanceof SpaceError) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code
        });
      }
      throw error;
    }
  });
} 