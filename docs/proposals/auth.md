# Authentication Proposal

## Overview

This proposal outlines OAuth-only authentication for t69 using a **separate Node.js API server** architecture. The SvelteKit frontend will be a static site that communicates with the API server for authentication and sync operations.

## Architecture

### Frontend (SvelteKit - Static)
- **Deployment**: Static site hosted on S3, Vercel, Netlify, etc.
- **Auth Flow**: Redirects to API server for OAuth, receives JWT tokens
- **API Communication**: Uses fetch() to communicate with Node.js API server
- **Token Storage**: Stores JWT tokens in localStorage/sessionStorage
- **No Server-Side Auth**: Pure client-side auth state management

### Backend (Node.js API Server)
- **Location**: `packages/server/`
- **Framework**: Express.js or Fastify
- **Database**: SQLite (as specified in server-sync proposal)
- **Auth Library**: Passport.js for OAuth
- **Token Management**: JWT for stateless authentication

## Database Schema

The API server will use SQLite with the following schema:

```sql
-- Users table (one record per user)
CREATE TABLE users (
    id TEXT PRIMARY KEY,              -- UUID v4
    email TEXT UNIQUE NOT NULL,       -- Primary email from first OAuth provider
    name TEXT,                        -- Display name
    avatar_url TEXT,                  -- Profile picture URL
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- OAuth accounts table (multiple providers per user)
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,              -- UUID v4
    user_id TEXT NOT NULL,            -- Foreign key to users.id
    provider TEXT NOT NULL,           -- 'google', 'github', 'twitter'
    provider_account_id TEXT NOT NULL, -- OAuth provider's user ID
    provider_email TEXT,              -- Email from this provider
    access_token TEXT,                -- OAuth access token
    refresh_token TEXT,               -- OAuth refresh token (if available)
    expires_at INTEGER,               -- Token expiration timestamp
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE(provider, provider_account_id)
);

-- Indexes for performance
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_provider ON accounts(provider, provider_account_id);
```

## API Endpoints

### Authentication Endpoints

```
GET  /auth/login/:provider          # Initiate OAuth flow
GET  /auth/callback/:provider       # OAuth callback handler
POST /auth/logout                   # Logout (invalidate token)
GET  /auth/me                       # Get current user info
```

### Account Management

```
GET    /auth/accounts               # List user's linked accounts
DELETE /auth/accounts/:provider     # Unlink OAuth provider
```

## OAuth Flow

### 1. Login Initiation
```
Frontend: window.location = 'https://api.t69.dev/auth/login/google'
```

### 2. OAuth Callback
```
API Server: 
- Receives OAuth code
- Exchanges for access token
- Creates/links user account
- Generates JWT token
- Redirects to frontend with token
```

### 3. Frontend Token Handling
```
Frontend: 
- Extracts JWT from URL
- Stores in localStorage
- Redirects to app
```

## JWT Token Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com", 
  "name": "User Name",
  "avatar_url": "https://...",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Frontend Implementation

### Auth Store (Svelte)
```javascript
// stores/auth.js
import { writable } from 'svelte/store';

const API_BASE = 'https://api.t69.dev';

function createAuthStore() {
  const { subscribe, set, update } = writable({
    user: null,
    token: null,
    loading: true
  });

  return {
    subscribe,
    
    // Initialize auth state from localStorage
    init() {
      const token = localStorage.getItem('auth_token');
      if (token) {
        this.verifyToken(token);
      } else {
        set({ user: null, token: null, loading: false });
      }
    },
    
    // Verify JWT token with API
    async verifyToken(token) {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const user = await response.json();
          set({ user, token, loading: false });
          localStorage.setItem('auth_token', token);
        } else {
          this.logout();
        }
      } catch (error) {
        this.logout();
      }
    },
    
    // Login with OAuth provider
    login(provider) {
      window.location.href = `${API_BASE}/auth/login/${provider}`;
    },
    
    // Logout
    async logout() {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (error) {
          // Ignore errors, logout anyway
        }
      }
      
      localStorage.removeItem('auth_token');
      set({ user: null, token: null, loading: false });
    }
  };
}

export const auth = createAuthStore();
```

### Auth Component
```svelte
<!-- components/Auth.svelte -->
<script>
  import { auth } from '../stores/auth.js';
  import { onMount } from 'svelte';
  
  onMount(() => {
    // Check for token in URL (OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      auth.verifyToken(token);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else {
      auth.init();
    }
  });
</script>

{#if $auth.loading}
  <div>Loading...</div>
{:else if $auth.user}
  <div class="flex items-center gap-4">
    <img src={$auth.user.avatar_url} alt="Avatar" class="w-8 h-8 rounded-full" />
    <span>{$auth.user.name}</span>
    <button on:click={() => auth.logout()}>Logout</button>
  </div>
{:else}
  <div class="space-x-2">
    <button on:click={() => auth.login('google')}>Login with Google</button>
    <button on:click={() => auth.login('github')}>Login with GitHub</button>
    <button on:click={() => auth.login('twitter')}>Login with X</button>
  </div>
{/if}
```

## API Server Implementation

### Dependencies
```json
{
  "express": "^4.18.0",
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "passport-github2": "^0.1.12",
  "passport-twitter": "^1.0.4",
  "jsonwebtoken": "^9.0.0",
  "sqlite3": "^5.1.0",
  "cors": "^2.8.5",
  "dotenv": "^16.0.0"
}
```

### Environment Variables
```env
# OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

TWITTER_CONSUMER_KEY=your_twitter_consumer_key
TWITTER_CONSUMER_SECRET=your_twitter_consumer_secret

# JWT
JWT_SECRET=your_jwt_secret_key

# URLs
API_BASE_URL=https://api.t69.dev
FRONTEND_URL=https://t69.dev

# Database
DATABASE_PATH=./data/t69.db
```

## OAuth Provider Configuration

### Google OAuth
- **Redirect URI**: `https://api.t69.dev/auth/callback/google`
- **Scopes**: `profile email`

### GitHub OAuth
- **Redirect URI**: `https://api.t69.dev/auth/callback/github`
- **Scopes**: `user:email`

### Twitter OAuth
- **Redirect URI**: `https://api.t69.dev/auth/callback/twitter`
- **Scopes**: `users.read tweet.read`

## Account Linking

Users can link multiple OAuth providers to a single account:

1. **First Login**: Creates new user account
2. **Subsequent Logins**: 
   - If email matches existing user → link account
   - If new email → create new user OR prompt to link

## Security Considerations

1. **JWT Expiration**: 30 days (configurable)
2. **CORS**: Restrict to frontend domain
3. **Rate Limiting**: Implement on auth endpoints
4. **Token Rotation**: Refresh tokens when possible
5. **Secure Storage**: HTTPOnly cookies option for enhanced security

## Development Setup

### Local Development
- **API Server**: `http://localhost:3001`
- **Frontend**: `http://localhost:5173`
- **OAuth Redirects**: All providers support localhost

### Production
- **API Server**: `https://api.t69.dev`
- **Frontend**: `https://t69.dev` (static hosting)

## Integration with Sync

This auth system integrates seamlessly with the server-sync proposal:

1. **User Identification**: JWT sub claim provides user ID for sync operations
2. **Authorization**: All sync endpoints require valid JWT token
3. **Data Isolation**: Each user's data is isolated by user ID

## Implementation Priority

1. **Phase 1**: Basic OAuth with Google
2. **Phase 2**: Add GitHub and Twitter providers
3. **Phase 3**: Account linking functionality
4. **Phase 4**: Enhanced security features

## Excluded Features

- Email/password authentication
- Email verification
- Password reset
- User registration forms
- Extended user profiles
- Role-based permissions
- Session management (using JWT only) 