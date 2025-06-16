  import jwt from 'jsonwebtoken';
import { Database, User } from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
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

export class AuthService {
  constructor(private db: Database) {}

  getGoogleAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: `${API_BASE_URL}/auth/callback/google`,
      response_type: 'code',
      scope: 'profile email',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleGoogleCallback(code: string): Promise<string> {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${API_BASE_URL}/auth/callback/google`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user info from Google');
    }

    const googleUser: GoogleUserInfo = await userResponse.json();

    // Find or create user
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

    // Create or update account
    const existingAccount = this.db.getAccountByProvider('google', googleUser.id);
    
    if (!existingAccount) {
      this.db.createAccount(
        user.id,
        'google',
        googleUser.id,
        googleUser.email,
        tokens.access_token,
        tokens.refresh_token,
        tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : undefined
      );
    }

    // Generate JWT token
    return this.generateToken(user);
  }

  generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
    };

    return jwt.sign(payload, JWT_SECRET);
  }

  async verifyToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = this.db.getUserById(decoded.sub);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
} 