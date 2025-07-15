# Implementation Guide: Tauri to Electron Migration

> **Note**: This document contains detailed implementation steps. For the high-level proposal and rationale, see [Electron Proposal](./electron-proposal.md).

## Quick Start (Final Experience)

After implementing this migration, developers will have this simple workflow:

```bash
# Clone and install
git clone <repo>
cd supa
npm install

# Run Electron app (default)
npm run dev

# Run web browser app
npm run dev:web

# Run mobile app (after initial setup)
npm run dev:mobile
```

## Current State

* Root `package.json` orchestrates scripts that invoke **Tauri CLI** inside `packages/client`
* Packages:
  * `core/` – shared domain logic, utilities, and business rules (unchanged)
  * `client/` – SvelteKit UI & front‑end logic (web build consumed by wrappers)
  * No dedicated desktop or mobile wrappers yet

## Target Architecture

```text
packages/
├── core/            ← Shared domain logic, utilities, and business rules
├── client/          ← Component library (shared UI, stores, utils)
├── shared-config/   ← Shared SvelteKit configurations and tooling
├── desktop/         ← SvelteKit app + Electron wrapper
├── web/             ← SvelteKit app for web deployment
└── mobile/          ← SvelteKit app + Capacitor wrapper
```

## Implementation Steps

### Step 1: Create Shared Configuration Package

Create `packages/shared-config/` with the following structure:

```text
packages/shared-config/
├── src/
│   ├── svelte.config.base.js
│   ├── vite.config.base.js
│   ├── tailwind.config.base.js
│   └── tsconfig.base.json
├── scripts/
│   └── build-utils.js
└── package.json
```

#### Base SvelteKit Configuration
```js
// packages/shared-config/src/svelte.config.base.js
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export function createSvelteConfig(overrides = {}) {
  return {
    preprocess: vitePreprocess(),
    kit: {
      adapter: adapter(),
      alias: {
        '@client': '../client/src',
        '@supa/core': '../core/src',
      },
      ...overrides.kit
    },
    ...overrides
  };
}
```

#### Base Vite Configuration
```js
// packages/shared-config/src/vite.config.base.js
import { sveltekit } from '@sveltejs/kit/vite';

export function createViteConfig(overrides = {}) {
  return {
    plugins: [sveltekit(), ...(overrides.plugins || [])],
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      ...overrides.define
    },
    ...overrides
  };
}
```

#### Shared Tailwind Configuration
```js
// packages/shared-config/src/tailwind.config.base.js
export function createTailwindConfig(overrides = {}) {
  return {
    content: [
      './src/**/*.{html,js,svelte,ts}',
      '../client/src/**/*.{html,js,svelte,ts}',
      ...(overrides.content || [])
    ],
    theme: {
      extend: {
        // Shared theme extensions
      }
    },
    plugins: [
      // Shared plugins
      ...(overrides.plugins || [])
    ],
    ...overrides
  };
}
```

### Step 2: Restructure Client Package

Transform `packages/client/` from standalone SvelteKit app to component library:

#### Export Structure
```ts
// packages/client/src/index.ts
export { default as ChatApp } from './lib/comps/apps/ChatApp.svelte';
export { default as Sidebar } from './lib/comps/sidebar/Sidebar.svelte';
export * from './lib/state/clientState.svelte.ts';
export * from './lib/spaces/SpacePointer.ts';
// Re-export core functionality for convenience
export * from '@app/core';
// ... other exports
```

#### Package.json Updates
```json
{
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./components": "./dist/components/index.js",
    "./stores": "./dist/stores/index.js"
  },
  "dependencies": {
    "@app/core": "*"
  }
}
```

#### File Structure Changes
- Remove `src/routes/`
- Remove `src/app.html`
- Keep `src/lib/` as the main export source

### Step 3: Create Desktop Package

Create `packages/desktop/` as a full SvelteKit app with Electron wrapper:

#### Dependencies
```bash
# In packages/desktop/
npm i -D electron electron-builder electron-devtools-installer
npm i -D concurrently wait-on

# For local package dependencies, you can either:
# Option A: Use relative paths in package.json
# Option B: Use npm link, or 
# Option C: Use file: protocol in package.json
```

#### SvelteKit Configuration
```js
// packages/desktop/svelte.config.js
import { createSvelteConfig } from '@app/shared-config';

export default createSvelteConfig({
  kit: {
    adapter: '@sveltejs/adapter-static',
    prerender: { entries: ['*'] }, // Desktop-specific prerendering
    files: {
      assets: 'static',
      hooks: {
        client: 'src/hooks.client.js',
        server: 'src/hooks.server.js'
      }
    }
  }
});
```

#### Vite Configuration
```js
// packages/desktop/vite.config.js
import { createViteConfig } from '@app/shared-config';

export default createViteConfig({
  define: {
    'process.env.PLATFORM': JSON.stringify('desktop'),
    'process.env.ELECTRON': JSON.stringify(true)
  },
  plugins: [
    // Desktop-specific plugins
  ]
});
```

#### SvelteKit Layout
```ts
// packages/desktop/src/routes/+layout.svelte
<script>
  import { SpaceTTabsLayout } from '@app/client';
  import { clientState } from '@app/client/stores';
</script>

<SpaceTTabsLayout />
```

#### Electron Main Process
```ts
// packages/desktop/electron/main.ts
const isDev = process.env.NODE_ENV === 'development';
const url = isDev 
  ? 'http://localhost:6969'  // SvelteKit dev server
  : `file://${path.join(__dirname, '../build/index.html')}`;
```

#### Package Scripts
```json
{
  "scripts": {
    "dev": "concurrently -k \"vite dev\" \"electron electron/main.ts\"",
    "build": "vite build && electron-builder"
  }
}
```

### Step 4: Create Web Package

Create `packages/web/` as a SvelteKit app for web deployment:

#### Setup
```bash
# Create the web package
npm create sveltekit@latest web

# Install dependencies (in packages/web/)
cd packages/web
npm install

# Set up local package dependencies (choose one approach):
# Option A: Use file: protocol in package.json
# Option B: Use npm link
# Option C: Use relative imports (not recommended)
```

#### SvelteKit Configuration
```js
// packages/web/svelte.config.js
import { createSvelteConfig } from '@app/shared-config';

export default createSvelteConfig({
  kit: {
    adapter: '@sveltejs/adapter-vercel', // or adapter-static, adapter-node, etc.
    serviceWorker: {
      register: true // PWA support
    }
  }
});
```

#### Vite Configuration
```js
// packages/web/vite.config.js
import { createViteConfig } from '@app/shared-config';

export default createViteConfig({
  define: {
    'process.env.PLATFORM': JSON.stringify('web'),
    'process.env.ELECTRON': JSON.stringify(false)
  },
  plugins: [
    // Web-specific plugins (PWA, etc.)
  ]
});
```

#### SvelteKit Layout
```ts
// packages/web/src/routes/+layout.svelte
<script>
  import { SpaceTTabsLayout } from '@app/client';
  import { clientState } from '@app/client/stores';
  // Web-specific configurations (no Electron APIs)
</script>

<SpaceTTabsLayout />
```

### Step 5: Create Mobile Package

Create `packages/mobile/` as a SvelteKit app with Capacitor wrapper:

#### Setup
```bash
# Create the mobile package
npm create sveltekit@latest mobile

# Install dependencies (in packages/mobile/)
cd packages/mobile
npm install

# Set up Capacitor
npx cap add ios android

# Set up local package dependencies (same as web package)
```

#### SvelteKit Configuration
```js
// packages/mobile/svelte.config.js
import { createSvelteConfig } from '@app/shared-config';

export default createSvelteConfig({
  kit: {
    adapter: '@sveltejs/adapter-static',
    prerender: { entries: ['*'] }, // Mobile-specific prerendering
    paths: {
      base: '', // Important for Capacitor
      assets: ''
    }
  }
});
```

#### Vite Configuration
```js
// packages/mobile/vite.config.js
import { createViteConfig } from '@app/shared-config';

export default createViteConfig({
  define: {
    'process.env.PLATFORM': JSON.stringify('mobile'),
    'process.env.CAPACITOR': JSON.stringify(true)
  },
  plugins: [
    // Mobile-specific plugins
  ]
});
```

#### Capacitor Configuration
```ts
// packages/mobile/capacitor.config.ts
export default {
  webDir: "build",  // SvelteKit output
  plugins: {
    Filesystem: {},
    // other mobile plugins
  }
};
```

#### Build Process
```bash
npm run build  # SvelteKit build
npx cap copy   # Copy to native projects
npx cap run ios/android
```

### Step 6: Implement File System Abstraction

Create platform-specific file system implementations:

| Operation   | Electron (Node)         | Capacitor (Plugin)     | Web (Fallback)        |
| ----------- | ----------------------- | ---------------------- | --------------------- |
| `readFile`  | `fs.promises.readFile`  | `Filesystem.readFile`  | `localStorage/indexedDB` |
| `writeFile` | `fs.promises.writeFile` | `Filesystem.writeFile` | `localStorage/indexedDB` |

Export an abstract adapter from `core/fs.ts` and provide per‑platform implementations.

## Local Package Dependencies

Since we're using Option 1 (Simple Scripts), here's how to handle dependencies between packages:

### Option A: File Protocol (Recommended)
```json
// packages/desktop/package.json
{
  "dependencies": {
    "@app/core": "file:../core",
    "@app/client": "file:../client",
    "@app/shared-config": "file:../shared-config"
  }
}
```

### Option B: npm link
```bash
# In packages/core/
npm link

# In packages/desktop/
npm link @app/core
```

### Option C: Relative Imports (Not Recommended)
```js
// Avoid this - makes refactoring harder
import { something } from '../../core/src/index.js';
```

**Recommendation**: Use Option A (file protocol) for simplicity and reliability.

## Development Workflow

### Root Package.json Setup

Set up the root `package.json` with these scripts for a simple developer experience:

**Option 1: Simple Scripts (Recommended)**

```json
{
  "name": "supa",
  "private": true,
  "scripts": {
    "dev": "npm run dev:desktop",
    "dev:desktop": "concurrently -k \"npm run client:build:watch\" \"npm run desktop:dev\"",
    "dev:web": "concurrently -k \"npm run client:build:watch\" \"npm run web:dev\"",
    "dev:mobile": "concurrently -k \"npm run client:build:watch\" \"npm run mobile:dev\"",
    "dev:all": "concurrently -k \"npm run client:build:watch\" \"npm run desktop:dev\" \"npm run web:dev\"",
    
    "build": "npm run build:core && npm run build:client && npm run build:desktop",
    "build:core": "cd packages/core && npm run build",
    "build:client": "cd packages/client && npm run build",
    "build:desktop": "cd packages/desktop && npm run build",
    "build:web": "cd packages/web && npm run build",
    "build:mobile": "cd packages/mobile && npm run build",
    
    "client:build:watch": "cd packages/client && npm run build:watch",
    "desktop:dev": "cd packages/desktop && npm run dev",
    "web:dev": "cd packages/web && npm run dev",
    "mobile:dev": "cd packages/mobile && npm run dev"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

**Option 2: With npm workspaces (if you want the benefits)**

```json
{
  "name": "supa",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "npm run dev:desktop",
    "dev:desktop": "concurrently -k \"npm:client:build:watch\" \"npm:desktop:dev\"",
    "dev:web": "concurrently -k \"npm:client:build:watch\" \"npm:web:dev\"",
    "dev:mobile": "concurrently -k \"npm:client:build:watch\" \"npm:mobile:dev\"",
    "dev:all": "concurrently -k \"npm:client:build:watch\" \"npm:desktop:dev\" \"npm:web:dev\"",
    
    "build": "npm run build:core && npm run build:client && npm run build:desktop",
    "build:core": "npm run build --workspace packages/core",
    "build:client": "npm run build --workspace packages/client",
    "build:desktop": "npm run build --workspace packages/desktop",
    "build:web": "npm run build --workspace packages/web",
    "build:mobile": "npm run build --workspace packages/mobile",
    
    "client:build:watch": "npm run build:watch --workspace packages/client",
    "desktop:dev": "npm run dev --workspace packages/desktop",
    "web:dev": "npm run dev --workspace packages/web",
    "mobile:dev": "npm run dev --workspace packages/mobile"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

## npm Workspaces vs Simple Scripts

### Option 1: Simple Scripts (Recommended)
**Pros:**
- Familiar `cd` commands - everyone understands this
- No new concepts to learn
- Works with existing setup
- Simple and transparent

**Cons:**
- Need to `cd` into each package directory
- No shared `node_modules` optimization
- Manual dependency management between packages

### Option 2: npm Workspaces
**Pros:**
- Shared `node_modules` (smaller disk usage)
- `npm install` from root installs all packages
- Better cross-package dependency management
- Can run commands across all workspaces

**Cons:**
- Learning curve for `--workspace` flag
- More complex setup
- Potential version conflicts

## Recommendation

**Use Option 1 (Simple Scripts)** unless you specifically need workspace benefits. You can always migrate to workspaces later if needed.

### Simple Developer Experience

For new developers getting started with Supa:

```bash
# Install all dependencies
npm install

# Run Electron app (default)
npm run dev

# Run web browser app
npm run dev:web

# Run mobile app (requires additional setup)
npm run dev:mobile

# Run everything at once
npm run dev:all
```

### Per-Platform Development (Advanced)

For working on specific platforms:

```bash
# Desktop only
npm --workspace packages/desktop run dev

# Web only
npm --workspace packages/web run dev

# Mobile only
npm --workspace packages/mobile run dev
```

## Build & Release Process

* **Core Library**: `npm --workspace packages/core run build`
* **Client Library**: `npm --workspace packages/client run build` (depends on core)
* **Desktop**: `npm --workspace packages/desktop run build` → electron‑builder outputs
* **Web**: `npm --workspace packages/web run build` → static files for web deployment
* **Mobile**: `npm --workspace packages/mobile run build` → `npx cap copy` → native builds

## Security Considerations

### Electron Security
- Implement CSP (Content Security Policy)
- Validate all IPC messages
- Use secure defaults for BrowserWindow options
- Careful preload script implementation

### Example Secure BrowserWindow
```ts
// packages/desktop/electron/main.ts
const mainWindow = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, 'preload.js')
  }
});
```

## Testing Strategy

- **Unit Tests**: Client library components
- **Integration Tests**: Platform-specific features
- **Cross-Platform Tests**: Desktop, web, mobile smoke tests
- **Component Library Tests**: API consistency

## Performance Optimizations

- **Lazy Loading**: Electron main process optimization
- **Native Dependencies**: Use `electron-rebuild` as needed
- **Code Splitting**: Optimize renderer process
- **Tree-Shaking**: Remove unused client components per platform

## Configuration Sharing Alternatives

If the shared-config package approach doesn't work:

1. **File Copying**: Copy template configs during setup
2. **Scaffolding Tool**: Custom CLI for generating platform packages
3. **Workspace Configuration**: Use npm workspace features
4. **Shared Scripts**: Common build scripts in root package.json

## Migration Checklist

### Phase 1: Setup
- [ ] Create `shared-config/` package
- [ ] Restructure `client/` as library
- [ ] Set up proper exports and build process
- [ ] Update root `package.json` with workspace scripts

### Phase 2: Platform Creation
- [ ] Create desktop SvelteKit app + Electron wrapper
- [ ] Create web SvelteKit app
- [ ] Create mobile SvelteKit app + Capacitor wrapper
- [ ] Test simple developer workflow (`npm install`, `npm run dev`)

### Phase 3: Migration
- [ ] Migrate existing features to new architecture
- [ ] Test cross-platform compatibility
- [ ] Remove Tauri dependencies
- [ ] Update CI/CD workflows
- [ ] Update documentation and onboarding guides

## Troubleshooting

### Common Issues
- **Build Dependencies**: Ensure client library builds before platform apps
- **Path Resolution**: Verify alias configurations in shared-config
- **Module Resolution**: Check workspace dependency linking

### Debug Commands
```bash
# Check workspace dependencies
npm ls --workspaces

# Build order verification
npm run build --workspace packages/core
npm run build --workspace packages/client
npm run build --workspace packages/desktop
```

## Related Documents

- [High-Level Proposal](./electron-proposal.md)