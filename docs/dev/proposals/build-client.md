# Proposal: Build Client Package as Library

## Problem

Desktop package cannot import client components due to alias conflicts:
- Desktop needs `$lib` → `packages/desktop/src/lib`
- Client uses `$lib` → `packages/client/src/lib` internally
- Cannot alias `$lib` to both locations simultaneously

## Solution

Build client package as a library that resolves all internal aliases (`$lib`, `@core`) during build time, eliminating alias dependencies in the output.

## Implementation

### 1. Update Existing Client Config

```js
// packages/client/vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  
  // Add library build config
  build: {
    lib: {
      entry: './src/lib/index.ts',
      formats: ['es']
    },
    sourcemap: true
  },
  
  // Keep existing alias
  resolve: {
    alias: {
      "@core": "../core/src",
    }
  }
});
```

### 2. Update Client Package.json

```json
{
  "main": "./dist/index.js",
  "exports": { ".": "./dist/index.js" },
  "scripts": {
    "build:watch": "vite build --watch"
  }
}
```

### 3. Update Desktop Import

```js
// packages/desktop/vite.config.js
resolve: {
  alias: {
    '@supa-app': '../client/dist/index.js'
  }
}
```

### 4. Development Workflow

```bash
# Terminal 1: Build client in watch mode
cd packages/client && npm run build:watch

# Terminal 2: Run desktop
cd packages/desktop && npm run dev
```

## Benefits

- ✅ Resolves alias conflicts completely
- ✅ Enables source map debugging
- ✅ Zero code changes in client package
- ✅ Uses existing vite.config.js - no separate config
- ✅ Watch mode for development

## Debugging Experience

Source maps (`sourcemap: true`) ensure breakpoints work in **original source files** instead of compiled dist files:

- Set breakpoints in `SpaceEntry.svelte` → debugger stops in actual `.svelte` file
- VS Code shows original file structure in debugger
- Stack traces reference source files, not dist files
- Essential for productive development when importing library components

## Files Changed

- `packages/client/vite.config.js` (add lib build)
- `packages/client/package.json` (exports, scripts)
- `packages/desktop/vite.config.js` (alias update) 