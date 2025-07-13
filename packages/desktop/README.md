# Supa Desktop - SvelteKit + Electron

A desktop application built with SvelteKit and Electron, featuring Skeleton UI components and Tailwind CSS.

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode (starts both SvelteKit dev server and Electron)
npm run dev

# Build for production
npm run build

# Run built app
npm start
```

## Development

### Development Mode

The development setup runs two processes concurrently:

1. **SvelteKit Dev Server** (`npm run svelte:dev`) - Runs on http://localhost:5173
2. **Electron App** (`npm run electron:dev`) - Loads the dev server URL

This provides:
- Hot Module Replacement (HMR) from SvelteKit
- Automatic DevTools opening
- Hot reload for Electron main process changes

### Building

```bash
# Build SvelteKit for production
npm run svelte:build

# Build Electron app with SvelteKit
npm run build

# Build for specific platforms
npm run electron:build:mac
npm run electron:build:win
npm run electron:build:linux
```

## Architecture

### Key Technologies

- **SvelteKit** - Frontend framework with adapter-static
- **Electron** - Desktop app wrapper
- **Skeleton UI** - Design system and components
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type safety

### Project Structure

```
packages/desktop/
├── src/
│   ├── routes/          # SvelteKit routes
│   ├── lib/             # Shared components and utilities
│   ├── app.html         # Main HTML template
│   └── app.css          # Global styles
├── static/              # Static assets
├── build/               # Built SvelteKit files (generated)
├── dist/                # Electron build output
├── main.js              # Electron main process
├── svelte.config.js     # SvelteKit configuration
├── vite.config.js       # Vite configuration
└── tailwind.config.ts   # Tailwind configuration
```

### Configuration

- **SvelteKit** configured with `adapter-static` for static file generation
- **Electron** loads dev server in development, built files in production
- **Tailwind** integrated with Skeleton UI components
- **TypeScript** support throughout

## Features Demonstrated

1. **SvelteKit Integration** - Full SvelteKit app running in Electron
2. **Skeleton UI Components** - Modern design system
3. **Development Workflow** - Hot reloading and DevTools
4. **Production Building** - Static file generation for Electron
5. **Cross-Platform** - Windows, macOS, and Linux support

## Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development (SvelteKit + Electron) |
| `npm run svelte:dev` | Start only SvelteKit dev server |
| `npm run electron:dev` | Start only Electron (requires SvelteKit server) |
| `npm run build` | Build both SvelteKit and Electron |
| `npm run svelte:build` | Build only SvelteKit |
| `npm run electron:build` | Build only Electron |
| `npm run preview` | Preview built SvelteKit app |
| `npm run check` | Run Svelte type checking |

## Why This Setup?

This setup provides:

1. **Modern Development** - SvelteKit's excellent DX with HMR
2. **Cross-Platform** - Electron ensures consistent behavior
3. **Production Ready** - Static builds work reliably in Electron
4. **Scalable** - Easy to add new features and components
5. **Type Safe** - Full TypeScript support

## Next Steps

1. **Test the setup** - Run `npm run dev` and verify everything works
2. **Add features** - Create new SvelteKit routes and components
3. **Customize UI** - Modify Skeleton themes and Tailwind configuration
4. **Add IPC** - Implement Electron main/renderer communication
5. **Package** - Use electron-builder for distribution

This is the foundation for the Tauri → Electron migration as outlined in the [electron-proposal.md](../../docs/dev/proposals/electron-proposal.md). 