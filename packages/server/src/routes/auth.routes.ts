import { FastifyInstance } from 'fastify';
import { AuthService, AuthError } from '../auth';
import { createAuthMiddleware } from '../middleware/auth.middleware';

// Helper to extract JWT token from Authorization header
function getAuthToken(authorization?: string): string | null {
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.substring(7);
  }
  return null;
}

export function registerAuthRoutes(fastify: FastifyInstance, auth: AuthService, frontendUrl: string) {
  const authMiddleware = createAuthMiddleware(auth);

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
        return reply.redirect(`${frontendUrl}/auth/callback?error=${error}`, 302);
      }

      if (!code) {
        return reply.redirect(`${frontendUrl}/auth/callback?error=missing_code`, 302);
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
        
        const redirectUrl = `${frontendUrl}/auth/callback?${params.toString()}`;
        return reply.redirect(redirectUrl, 302);
      } catch (error) {
        console.error("Google callback error:", error);
        if (error instanceof Error && error.message === "Invalid token") {
          return reply.redirect(`${frontendUrl}/auth/callback?error=invalid_token`, 302);
        }
        return reply.redirect(`${frontendUrl}/auth/callback?error=auth_failed`, 302);
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

  // Get current user info (protected route)
  fastify.get('/auth/me', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    // User is already attached to request by middleware
    return request.user;
  });

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
  fastify.post('/auth/logout', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    // For JWT tokens, logout is handled client-side by removing the token
    // We could implement token blacklisting here if needed in the future
    return { success: true };
  });
} 