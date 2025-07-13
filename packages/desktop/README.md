# Supa Desktop - Hello World

A simple self-contained Electron app to test the build process and get familiar with Electron.

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode (with DevTools)
npm run dev

# Run in production mode
npm start

# Build for current platform
npm run build
```

## What's Here

- **main.js** - Main process (Node.js environment)
- **index.html** - Renderer process UI
- **renderer.js** - Renderer process JavaScript
- **styles.css** - Styling for the app
- **package.json** - Dependencies and build configuration

## Key Features Demonstrated

1. **Main Process** - Window creation and app lifecycle
2. **Renderer Process** - Web UI with access to Node.js APIs
3. **Development Mode** - DevTools automatically open
4. **Build Process** - electron-builder for creating distributables

## Why This Matters

This is the foundation for the Tauri → Electron migration. Once we confirm this works:

1. We can replace the HTML/CSS/JS with SvelteKit
2. We can integrate with the existing `@app/core` and `@app/client` packages
3. We can add file system operations, native menus, etc.

## Next Steps

1. Test building on your platform
2. Try the different build commands
3. Explore the generated files in `dist/`
4. Once comfortable, we can start integrating SvelteKit 