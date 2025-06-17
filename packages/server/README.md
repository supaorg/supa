# T69 Auth Server

A simple Node.js authentication server with Google OAuth support, built with Fastify.

## 🚀 Quick Start (No Setup Required!)

```bash
git clone <repo>
cd packages/server
npm install
npm run dev
```

That's it! The server runs in **mock auth mode** by default - no OAuth setup needed for development.

Visit `http://localhost:3131/dev/info` to see available endpoints and test the auth flow.

## Features

- 🔧 **Mock Auth Mode** - Zero-config development experience
- 🚀 **Fastify** - Fast and lightweight web framework
- 🔐 **Google OAuth** - Secure authentication flow (when configured)
- 🗄️ **SQLite** - Simple database with better-sqlite3
- 🎯 **JWT Tokens** - Stateless authentication
- 📝 **TypeScript** - Full type safety
- 🔄 **CORS** - Configured for frontend communication
- 📊 **Logging** - Pretty logs with Pino

## Development Modes

### Mock Mode (Default)
- **No OAuth setup required** - Perfect for new developers
- **Automatic mock user** - `dev-user@t69.chat` created automatically
- **Instant auth flow** - Click login and you're authenticated
- **All endpoints work** - Full API functionality without external dependencies

### OAuth Mode (Production)
- **Real Google OAuth** - For production or testing real auth flows
- **Requires setup** - Google Cloud Console configuration needed

## API Endpoints

- `GET /health` - Health check with auth mode info
- `GET /dev/info` - Development info (dev only)
- `GET /auth/login/google` - Start OAuth flow (or mock login)
- `GET /auth/callback/google` - OAuth callback handler
- `GET /auth/me` - Get current user (requires Bearer token)
- `POST /auth/refresh` - Refresh user data
- `POST /auth/logout` - Logout

## Testing the Auth Flow

### In Mock Mode (Default)
1. Start server: `npm run dev`
2. Visit: `http://localhost:3131/auth/login/google`
3. You'll be instantly "logged in" as the mock user
4. Use the returned JWT token for API calls

### Quick Test Commands
```bash
# Get server info
curl http://localhost:3131/dev/info

# Test login flow (returns JWT in redirect)
curl -I http://localhost:3131/auth/login/google

# Test with token (replace YOUR_TOKEN)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3131/auth/me
```

## Switching to Real OAuth

To enable real Google OAuth (optional):

1. **Get Google OAuth credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add redirect URI: `http://localhost:3131/auth/callback/google`

2. **Set environment variables:**
   ```bash
   cp env.example .env
   # Edit .env and add:
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

3. **Restart server:**
   ```bash
   npm run dev
   ```

The server will automatically switch to OAuth mode when credentials are detected.

## Environment Variables

```bash
# Optional - defaults work for development
PORT=3131
FRONTEND_URL=http://localhost:6969
API_BASE_URL=http://localhost:3131

# Optional - uses dev default in mock mode
JWT_SECRET=your-secret-key

# Optional - enables real OAuth when both are set
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Database

Uses SQLite database stored at `./data/t69.db` with tables:
- `users` - User profiles (id, email, name, avatar_url)
- `accounts` - OAuth account links (user_id, provider, provider_account_id)

In mock mode, creates a default user: `dev-user@t69.chat`

## Production

```bash
npm run build
npm start
```

Make sure to set:
- `NODE_ENV=production`
- `JWT_SECRET=strong-secret-key`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Configure proper CORS origins
- Set up HTTPS for OAuth callbacks

## Architecture Benefits

- **Zero barrier to entry** - New developers can start immediately
- **Gradual complexity** - Add real OAuth only when needed
- **Same API surface** - Mock and real modes have identical APIs
- **Production ready** - Easy transition from dev to production 