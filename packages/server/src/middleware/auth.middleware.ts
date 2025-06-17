import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService, AuthError } from '../auth';

// Helper to extract JWT token from Authorization header
function getAuthToken(authorization?: string): string | null {
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.substring(7);
  }
  return null;
}

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      name: string;
    };
  }
}

export function createAuthMiddleware(auth: AuthService) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const token = getAuthToken(request.headers.authorization);

    if (!token) {
      return reply.code(401).send({ 
        error: 'No token provided', 
        code: 'NO_TOKEN' 
      });
    }

    try {
      const user = await auth.verifyToken(token);
      // Attach user to request for use in route handlers
      request.user = user;
    } catch (error) {
      if (error instanceof AuthError) {
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code
        });
      }
      return reply.code(401).send({ 
        error: 'Token verification failed', 
        code: 'TOKEN_FAILED' 
      });
    }
  };
} 