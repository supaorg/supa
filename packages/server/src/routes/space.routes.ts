import { FastifyInstance } from 'fastify';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { SpaceCreationResponse } from '@core/apiTypes';
import { Services, SpaceError } from '../services';

export function registerSpaceRoutes(fastify: FastifyInstance, services: Services) {
  const authMiddleware = createAuthMiddleware(services.auth);

  // List user's spaces
  fastify.get('/spaces', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    try {
      const spaces = services.spaces.listUserSpaces(request.user!.id);
      return reply.send(spaces);
    } catch (error) {
      console.error('Failed to list spaces:', error);
      if (error instanceof SpaceError) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code
        });
      }
      return reply.code(500).send({
        error: 'Failed to list spaces',
        code: 'SPACE_LIST_FAILED'
      });
    }
  });

  // Create a new space
  fastify.post('/spaces', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    try {
      const ownerId = request.user!.id;

      // Create new space with SpaceService
      const { metadata, sync } = await services.spaces.createSpace(ownerId);
      const operations = sync.space.tree.getAllOps();
      const secrets = sync.space.getAllSecrets() || {};

      const space: SpaceCreationResponse = {
        id: metadata.id,
        created_at: metadata.created_at,
        owner_id: metadata.owner_id,
        operations,
        secrets
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

  // Get space by ID and its tree operations
  fastify.get<{ Params: { id: string } }>('/spaces/:id', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user!.id;

      // Check if user can access this space
      if (!services.spaces.canUserAccessSpace(userId, id)) {
        return reply.code(403).send({
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      // Load space with SpaceService
      const sync = await services.spaces.loadSpace(id);
      const metadata = services.spaces.getSpace(id)!;

      // Get operations for the space
      const operations = await sync.loadTreeOps(id);
      const secrets = sync.space.getAllSecrets() || {};

      const space: SpaceCreationResponse = {
        id: metadata.id,
        created_at: metadata.created_at,
        owner_id: metadata.owner_id,
        operations,
        secrets
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
      return reply.code(500).send({
        error: 'Failed to load space',
        code: 'SPACE_LOAD_FAILED'
      });
    }
  });

  // Get operations for a specific tree
  fastify.get<{ Params: { spaceId: string, treeId: string } }>('/spaces/:spaceId/:treeId', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    const { spaceId, treeId } = request.params;

    const userId = request.user!.id;

    // Check if user can access this space
    if (!services.spaces.canUserAccessSpace(userId, spaceId)) {
      return reply.code(403).send({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    const sync = await services.spaces.loadSpace(spaceId);
    const operations = await sync.loadTreeOps(treeId);

    return reply.send(operations);
  });

  // Update space metadata
  fastify.put<{ Params: { id: string } }>('/spaces/:id', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user!.id;
      const { name } = request.body as { name?: string };

      // Check if user owns this space
      if (!services.spaces.isSpaceOwner(userId, id)) {
        return reply.code(403).send({
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      if (name) {
        services.spaces.updateSpace(id, { name });
      }

      const metadata = services.spaces.getSpace(id)!;
      return reply.send(metadata);
    } catch (error) {
      console.error('Failed to update space:', error);
      if (error instanceof SpaceError) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code
        });
      }
      return reply.code(500).send({
        error: 'Failed to update space',
        code: 'SPACE_UPDATE_FAILED'
      });
    }
  });

  // Delete space
  fastify.delete<{ Params: { id: string } }>('/spaces/:id', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user!.id;

      // Check if user owns this space
      if (!services.spaces.isSpaceOwner(userId, id)) {
        return reply.code(403).send({
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      await services.spaces.deleteSpace(id);
      return reply.code(204).send();
    } catch (error) {
      console.error('Failed to delete space:', error);
      if (error instanceof SpaceError) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code
        });
      }
      return reply.code(500).send({
        error: 'Failed to delete space',
        code: 'SPACE_DELETE_FAILED'
      });
    }
  });
} 