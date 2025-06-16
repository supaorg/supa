import jwt from 'jsonwebtoken';
import { Database, User } from './database.js';

// Environment variables with validation
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-not-for-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3131';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Check if we're in mock mode (development without OAuth credentials)
const IS_MOCK_MODE = NODE_ENV === 'development' && (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET);

if (!IS_MOCK_MODE) {
  // Validate required environment variables for production
  if (!JWT_SECRET || JWT_SECRET === 'dev-secret-key-not-for-production') {
    throw new Error('JWT_SECRET environment variable is required for production');
  }
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID environment variable is required');
  }
  if (!GOOGLE_CLIENT_SECRET) {
    throw new Error('GOOGLE_CLIENT_SECRET environment variable is required');
  }
}

// Now we can safely use these as non-undefined (or use mock values)
const VALIDATED_JWT_SECRET: string = JWT_SECRET;
const VALIDATED_GOOGLE_CLIENT_ID: string = GOOGLE_CLIENT_ID || 'mock-client-id';
const VALIDATED_GOOGLE_CLIENT_SECRET: string = GOOGLE_CLIENT_SECRET || 'mock-client-secret';

// Types
interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  avatar_url: string;
  iat: number;
  exp: number;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthService {
  private readonly JWT_EXPIRY_DAYS = 30;
  
  constructor(private db: Database) {
    if (IS_MOCK_MODE) {
      console.log('🔧 Running in MOCK AUTH MODE - OAuth disabled for development');
      console.log('   To enable real OAuth, set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
      this.createMockUser();
    }
  }

  /**
   * Create a mock user for development
   */
  private createMockUser(): void {
    const mockEmail = 'dev@t69.local';
    let mockUser = this.db.getUserByEmail(mockEmail);
    
    if (!mockUser) {
      mockUser = this.db.createUser(
        mockEmail,
        'Dev User',
        'https://via.placeholder.com/150/0066cc/ffffff?text=DEV'
      );
      
      this.db.createAccount(
        mockUser.id,
        'mock',
        'mock-123',
        mockEmail,
        'mock-access-token',
        undefined,
        undefined
      );
      
      console.log(`   Created mock user: ${mockEmail}`);
    }
  }

  /**
   * Generate Google OAuth authorization URL
   */
  getGoogleAuthUrl(state?: string): string {
    if (IS_MOCK_MODE) {
      // In mock mode, redirect directly to callback with mock code
      const params = new URLSearchParams({ code: 'mock-auth-code' });
      if (state) params.set('state', state);
      return `${API_BASE_URL}/auth/callback/google?${params.toString()}`;
    }

    const params = new URLSearchParams({
      client_id: VALIDATED_GOOGLE_CLIENT_ID,
      redirect_uri: `${API_BASE_URL}/auth/callback/google`,
      response_type: 'code',
      scope: 'profile email',
      access_type: 'offline',
      prompt: 'consent'
    });

    if (state) {
      params.set('state', state);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Handle Google OAuth callback and return JWT token
   */
  async handleGoogleCallback(code: string): Promise<string> {
    if (IS_MOCK_MODE) {
      return this.handleMockCallback(code);
    }

    try {
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code);
      
      // Get user info from Google
      const googleUser = await this.getGoogleUserInfo(tokens.access_token);
      
      // Validate email is verified
      if (!googleUser.verified_email) {
        throw new AuthError('Email not verified with Google', 'EMAIL_NOT_VERIFIED', 400);
      }
      
      // Find or create user
      const user = await this.findOrCreateUser(googleUser);
      
      // Create or update OAuth account
      await this.createOrUpdateAccount(user.id, googleUser, tokens);
      
      // Generate JWT token
      return this.generateToken(user);
      
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('OAuth callback failed', 'OAUTH_CALLBACK_FAILED', 500);
    }
  }

  /**
   * Handle mock authentication callback
   */
  private handleMockCallback(code: string): string {
    if (code !== 'mock-auth-code') {
      throw new AuthError('Invalid mock auth code', 'INVALID_MOCK_CODE', 400);
    }

    const mockUser = this.db.getUserByEmail('dev@t69.local');
    if (!mockUser) {
      throw new AuthError('Mock user not found', 'MOCK_USER_NOT_FOUND', 500);
    }

    return this.generateToken(mockUser);
  }

  /**
   * Generate JWT token for user
   */
  generateToken(user: User): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      iat: now,
      exp: now + (this.JWT_EXPIRY_DAYS * 24 * 60 * 60),
    };

    return jwt.sign(payload, VALIDATED_JWT_SECRET);
  }

  /**
   * Verify JWT token and return user
   */
  async verifyToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, VALIDATED_JWT_SECRET) as jwt.JwtPayload;
      
      // Type guard to ensure we have the expected payload structure
      if (!decoded.sub || typeof decoded.sub !== 'string') {
        throw new AuthError('Invalid token payload', 'INVALID_TOKEN_PAYLOAD', 401);
      }
      
      // Check if token is expired (extra safety)
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        throw new AuthError('Token expired', 'TOKEN_EXPIRED', 401);
      }
      
      const user = this.db.getUserById(decoded.sub);
      
      if (!user) {
        throw new AuthError('User not found', 'USER_NOT_FOUND', 401);
      }
      
      return user;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthError('Invalid token', 'INVALID_TOKEN', 401);
      }
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Token verification failed', 'TOKEN_VERIFICATION_FAILED', 401);
    }
  }

  /**
   * Refresh user data from current accounts
   */
  async refreshUserData(userId: string): Promise<User | null> {
    const user = this.db.getUserById(userId);
    if (!user) return null;

    if (IS_MOCK_MODE) {
      // In mock mode, just return the user as-is
      return user;
    }

    const accounts = this.db.getUserAccounts(userId);
    
    // Try to refresh from Google if we have a valid token
    const googleAccount = accounts.find(acc => acc.provider === 'google');
    if (googleAccount && googleAccount.access_token) {
      try {
        const googleUser = await this.getGoogleUserInfo(googleAccount.access_token);
        this.db.updateUser(userId, {
          name: googleUser.name,
          avatar_url: googleUser.picture
        });
        return this.db.getUserById(userId);
      } catch (error) {
        // Token might be expired, that's ok
      }
    }

    return user;
  }

  /**
   * Check if running in mock mode
   */
  isMockMode(): boolean {
    return IS_MOCK_MODE;
  }

  // Private helper methods

  private async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: VALIDATED_GOOGLE_CLIENT_ID,
        client_secret: VALIDATED_GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${API_BASE_URL}/auth/callback/google`,
      }),
    });

    const tokens = await response.json() as GoogleTokenResponse;

    if (!response.ok || tokens.error) {
      throw new AuthError(
        tokens.error_description || 'Failed to exchange code for tokens',
        'TOKEN_EXCHANGE_FAILED',
        400
      );
    }

    return tokens;
  }

  private async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new AuthError('Failed to get user info from Google', 'GOOGLE_USER_INFO_FAILED', 400);
    }

    return await response.json() as GoogleUserInfo;
  }

  private findOrCreateUser(googleUser: GoogleUserInfo): User {
    let user = this.db.getUserByEmail(googleUser.email);
    
    if (!user) {
      // Create new user
      user = this.db.createUser(
        googleUser.email,
        googleUser.name,
        googleUser.picture
      );
    } else {
      // Update user info if needed
      this.db.updateUser(user.id, {
        name: googleUser.name,
        avatar_url: googleUser.picture
      });
      user = this.db.getUserById(user.id)!;
    }

    return user;
  }

  private createOrUpdateAccount(
    userId: string, 
    googleUser: GoogleUserInfo, 
    tokens: GoogleTokenResponse
  ): void {
    const existingAccount = this.db.getAccountByProvider('google', googleUser.id);
    
    if (!existingAccount) {
      this.db.createAccount(
        userId,
        'google',
        googleUser.id,
        googleUser.email,
        tokens.access_token,
        tokens.refresh_token,
        tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : undefined
      );
    }
    // Note: We could update existing account tokens here if needed
  }
} 