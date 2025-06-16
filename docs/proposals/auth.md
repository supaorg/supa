# Authentication Proposal

## Overview

This proposal outlines a **OAuth-only authentication system** for t69 using Auth.js (SvelteKit). This approach eliminates the complexity of password management while providing a smooth user experience through trusted OAuth providers.

## Design Principles

- **OAuth-only**: No email/password authentication - use trusted providers only
- **Simple setup**: Minimal configuration for both development and production
- **Provider agnostic**: Easy to add/remove OAuth providers
- **Localhost friendly**: Full support for local development
- **Minimal database**: Store only essential user information

## Technology Stack

- **Auth.js (SvelteKit)**: Official SvelteKit authentication library
- **SQLite**: User data storage in `platform.sqlite`
- **OAuth Providers**: Google, GitHub, X (Twitter)

## Database Schema

```sql
-- platform.sqlite

-- Users table - one record per user
CREATE TABLE users (
    id TEXT PRIMARY KEY,              -- UUID v4
    email TEXT UNIQUE NOT NULL,       -- Primary email (from first provider)
    name TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TODO: or identities? --
-- Accounts table - multiple OAuth accounts per user
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,              -- UUID v4
    user_id TEXT NOT NULL,            -- Foreign key to users.id
    provider TEXT NOT NULL,           -- 'google', 'github', 'twitter'
    provider_account_id TEXT NOT NULL, -- Provider's user ID
    provider_email TEXT,              -- Email from this provider
    provider_name TEXT,               -- Name from this provider
    provider_avatar_url TEXT,         -- Avatar from this provider
    access_token TEXT,                -- OAuth access token (optional)
    refresh_token TEXT,               -- OAuth refresh token (optional)
    expires_at INTEGER,               -- Token expiration (optional)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE(provider, provider_account_id)  -- Prevent duplicate provider accounts
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_provider ON accounts(provider, provider_account_id);
```

## Implementation

### 1. Install Dependencies

```bash
npm install @auth/sveltekit @auth/core
npm install @auth/sveltekit-adapter-sqlite # If using SQLite adapter
```

### 2. Environment Variables

```bash
# .env.local
AUTH_SECRET="your-random-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth  
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# X (Twitter) OAuth
TWITTER_CLIENT_ID="your-twitter-client-id"
TWITTER_CLIENT_SECRET="your-twitter-client-secret"
```

### 3. Auth Configuration

```js
// src/hooks.server.js
import { SvelteKitAuth } from '@auth/sveltekit'
import Google from '@auth/sveltekit/providers/google'
import GitHub from '@auth/sveltekit/providers/github'
import Twitter from '@auth/sveltekit/providers/twitter'
import { env } from '$env/dynamic/private'

export const { handle } = SvelteKitAuth({
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
    Twitter({
      clientId: env.TWITTER_CLIENT_ID,
      clientSecret: env.TWITTER_CLIENT_SECRET,
      version: "2.0" // Use Twitter API v2
    })
  ],
  secret: env.AUTH_SECRET,
  trustHost: true, // For development with localhost
  callbacks: {
    async signIn({ user, account, profile }) {
      // Custom logic for user creation/updates
      return true
    },
    async session({ session, user }) {
      // Customize session object
      return session
    }
  }
})
```

### 4. OAuth Provider Setup

#### Development Redirect URIs:
- **Google**: `http://localhost:5173/auth/callback/google`
- **GitHub**: `http://localhost:5173/auth/callback/github`  
- **X (Twitter)**: `http://localhost:5173/auth/callback/twitter`

#### Production Redirect URIs:
- **Google**: `https://yourdomain.com/auth/callback/google`
- **GitHub**: `https://yourdomain.com/auth/callback/github`
- **X (Twitter)**: `https://yourdomain.com/auth/callback/twitter`

### 5. Authentication API

Auth.js automatically provides these endpoints:

- `GET/POST /auth/signin` - Sign in page
- `GET/POST /auth/signout` - Sign out
- `GET /auth/callback/[provider]` - OAuth callback handler
- `GET /auth/session` - Get current session
- `GET /auth/csrf` - CSRF token

### 6. Usage in Components

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { page } from '$app/stores'
  import { signIn, signOut } from '@auth/sveltekit/client'
  
  $: session = $page.data.session
</script>

{#if session}
  <div class="user-info">
    <img src={session.user.image} alt={session.user.name} />
    <span>{session.user.name}</span>
    <button onclick={() => signOut()}>Sign Out</button>
  </div>
{:else}
  <div class="auth-buttons">
    <button onclick={() => signIn('google')}>Sign in with Google</button>
    <button onclick={() => signIn('github')}>Sign in with GitHub</button>
    <button onclick={() => signIn('twitter')}>Sign in with X</button>
  </div>
{/if}
```

### 7. Server-side Session Access

```js
// src/routes/+layout.server.js
export async function load(event) {
  return {
    session: await event.locals.getSession()
  }
}
```

## Development Workflow

1. **OAuth App Setup**: Create OAuth applications for each provider
2. **Environment Configuration**: Set up `.env.local` with client IDs/secrets
3. **Local Development**: Auth.js handles localhost redirects automatically
4. **Testing**: Test sign-in/sign-out flow with each provider

## Production Deployment

1. **Environment Variables**: Configure production OAuth credentials
2. **Redirect URIs**: Update OAuth apps with production URLs
3. **Database**: Ensure SQLite database is properly initialized
4. **HTTPS**: OAuth providers require HTTPS for production redirects

## What's NOT Included

This minimal auth system explicitly excludes:

- Email/password authentication
- Email verification
- Password reset functionality
- Account linking between providers
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- Account deletion workflows
- Advanced session management
- Rate limiting
- Audit logging

## Future Considerations

- **Account Linking**: Allow users to connect multiple OAuth providers
- **Profile Management**: Extended user profiles and preferences
- **Role System**: Add user roles and permissions
- **Admin Interface**: User management dashboard
- **Analytics**: Authentication metrics and monitoring 