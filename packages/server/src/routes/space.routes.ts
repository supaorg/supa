import { FastifyInstance } from 'fastify';
import { AuthService } from '../auth';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { createNewServerSpaceSync, loadExistingServerSpaceSync } from '../lib/ServerSpaceSync';
import { v4 as uuidv4 } from 'uuid';
import { SpaceCreationResponse } from '@core/apiTypes';

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
      const spaceId = uuidv4();
      const ownerId = request.user!.id;

      // Create new space with ServerSpaceSync
      const spaceSync = await createNewServerSpaceSync(spaceId, ownerId);
      // Get initial operations
      // @TODO: this doesn't work correctly for some reason; fix it.
      //const operations = await spaceSync.getTreeOps(spaceId);
      const operations = spaceSync.space.tree.getAllOps();

      const space: SpaceCreationResponse = {
        id: spaceId,
        created_at: Date.now(),
        owner_id: ownerId,
        operations
      };

      return reply.code(201).send(space);
    } catch (error) {
      console.error('Failed to create space:', error);
      if (error instanceof SpaceError) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code
        });
      }
      return reply.code(500).send({
        error: 'Failed to create space',
        code: 'SPACE_CREATION_FAILED'
      });
    }
  });

  // Get space by ID
  fastify.get<{ Params: { id: string } }>('/spaces/:id', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      // Load existing space with ServerSpaceSync
      const spaceSync = await loadExistingServerSpaceSync(id);

      // Get operations for the space
      const operations = await spaceSync.getTreeOps(id);

      const space: SpaceCreationResponse = {
        id,
        created_at: Date.now(), // TODO: Get actual creation time from database
        owner_id: request.user!.id, // TODO: Get actual owner from database
        operations
      };

      return reply.send(space);
    } catch (error) {
      console.error('Failed to load space:', error);
      if (error instanceof SpaceError) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code
        });
      }
      if (error instanceof Error && error.message.includes('Space database not found')) {
        return reply.code(404).send({
          error: 'Space not found',
          code: 'SPACE_NOT_FOUND'
        });
      }
      return reply.code(500).send({
        error: 'Failed to load space',
        code: 'SPACE_LOAD_FAILED'
      });
    }
  });
} 