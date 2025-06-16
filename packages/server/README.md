# T69 Auth Server

A simple Node.js authentication server with Google OAuth support, built with Fastify.

## Features

- 🚀 **Fastify** - Fast and lightweight web framework
- 🔐 **Google OAuth** - Secure authentication flow
- 🗄️ **SQLite** - Simple database with better-sqlite3
- 🎯 **JWT Tokens** - Stateless authentication
- 📝 **TypeScript** - Full type safety
- 🔄 **CORS** - Configured for frontend communication
- 📊 **Logging** - Pretty logs with Pino

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Then edit `.env` and add your Google OAuth credentials.

3. **Get Google OAuth credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add redirect URI: `http://localhost:3001/auth/callback/google`
   - Copy Client ID and Client Secret to `.env`

## Development

```bash
npm run dev
```

The server will start on `http://localhost:3001` with hot reload enabled.

## API Endpoints

- `GET /health` - Health check with uptime
- `GET /auth/login/google` - Start Google OAuth flow
- `GET /auth/callback/google` - Google OAuth callback
- `GET /auth/me` - Get current user (requires Bearer token)
- `POST /auth/logout` - Logout (client-side for JWT)

## Testing the Auth Flow

1. Visit `http://localhost:3001/auth/login/google`
2. Complete Google OAuth
3. You'll be redirected to frontend with JWT token
4. Use the token to call other endpoints:

```bash
# Get user info
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/auth/me
```

## Database

Uses SQLite database stored at `./data/t69.db` with tables:
- `users` - User profiles (id, email, name, avatar_url)
- `accounts` - OAuth account links (user_id, provider, provider_account_id)

The database is created automatically on first run.

## Production

```bash
npm run build
npm start
```

Make sure to:
- Set `NODE_ENV=production`
- Use a strong `JWT_SECRET`
- Configure proper CORS origins
- Set up HTTPS for OAuth callbacks 