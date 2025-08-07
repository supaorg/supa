# Build Scripts Proposal

## Problem

As our build logic grows more complex, the `package.json` scripts become harder to maintain and understand. The current approach of chaining multiple commands with `&&` and piping operations becomes unwieldy and difficult to debug.

## Current State

Our `packages/desktop/package.json` has complex build scripts like:

```json
{
  "scripts": {
    "prepare-static-files": "cpy '../client/static/**' './static-compiled' && cpy './static-desktop/**' './static-compiled'",
    "dev": "npm run prepare-static-files && concurrently \"npm run dev:client\" \"npm run dev:sveltekit\" \"npm run dev:electron\"",
    "build": "npm run prepare-static-files && npm run build -w @sila/client && npm run build:vite && npm run build:electron"
  }
}
```

## Proposed Solution

Move complex build orchestration to dedicated JavaScript build scripts while keeping `package.json` scripts simple and focused.

### Benefits

- **Better readability**: Complex logic is easier to follow in JS than in long shell command chains
- **Error handling**: Graceful error handling and edge case management
- **Reusability**: Logic can be reused, conditions added, and CLI options exposed
- **Cross-platform compatibility**: Node scripts are more portable than shell scripts
- **Maintainability**: Easier to add new build steps or modify existing ones

### Implementation

#### 1. Create a build script

Create `packages/desktop/build.js`:

```javascript
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const clientDir = path.join(root, 'packages/client');
const staticCompiled = path.join(__dirname, 'static-compiled');
const staticDesktop = path.join(__dirname, 'static-desktop');

function run(cmd, cwd = __dirname) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd });
}

async function copyStaticFiles() {
  console.log('Preparing static files...');
  await fs.remove(staticCompiled);
  await fs.copy(path.join(clientDir, 'static'), staticCompiled);
  await fs.copy(staticDesktop, staticCompiled);
  console.log('✓ Static files prepared');
}

async function buildClient() {
  console.log('Building client...');
  run('npm run build -w @sila/client', root);
  console.log('✓ Client built');
}

async function buildVite() {
  console.log('Building Vite...');
  run('vite build');
  console.log('✓ Vite built');
}

async function buildElectron() {
  console.log('Building Electron...');
  run('electron-builder');
  console.log('✓ Electron built');
}

async function main() {
  try {
    await copyStaticFiles();
    await buildClient();
    await buildVite();
    await buildElectron();
    console.log('\n🎉 Build complete!');
  } catch (err) {
    console.error('\n❌ Build failed:', err.message);
    process.exit(1);
  }
}

main();
```

#### 2. Update package.json

Simplify the scripts in `packages/desktop/package.json`:

```json
{
  "scripts": {
    "dev": "npm run prepare-static-files && concurrently \"npm run dev:client\" \"npm run dev:sveltekit\" \"npm run dev:electron\"",
    "dev:without-starting-electron": "npm run prepare-static-files && concurrently \"npm run dev:sveltekit\" \"npm run dev:client\"",
    "dev:sveltekit": "vite dev --port 6969",
    "dev:client": "npm run dev -w @sila/client",
    "dev:electron": "wait-on http://localhost:6969 && electron . --dev --remote-debugging-port=9222",
    "build": "node ./build.js",
    "build:electron:mac": "node ./build.js --platform=mac",
    "build:electron:mac-signed": "CSC_IDENTITY_AUTO_DISCOVERY=true node ./build.js --platform=mac",
    "build:publish": "node ./build.js --publish=always",
    "build:publish-draft": "node ./build.js --publish=draft",
    "preview": "vite preview",
    "start": "electron .",
    "check": "svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-check --tsconfig ./tsconfig.json --watch"
  }
}
```

#### 3. Add dependencies

Install required packages:

```bash
npm install --save-dev fs-extra
```

### Alternative Command Execution Methods

For different use cases, consider these alternatives to `execSync`:

#### Using `npm-run` (for npm scripts)
```javascript
import npmRun from 'npm-run';

npmRun.execSync('build -w @sila/client', { stdio: 'inherit' });
```

#### Using `shelljs` (shell-like syntax)
```javascript
import shell from 'shelljs';

shell.exec('npm run build -w @sila/client');
shell.exec('vite build');
```

#### Using `execa` (for complex async needs)
```javascript
import execa from 'execa';

await execa('npm', ['run', 'build', '-w', '@sila/client'], { stdio: 'inherit' });
```

### CLI Options

The build script can be extended to support CLI arguments:

```javascript
import yargs from 'yargs';

const argv = yargs
  .option('platform', {
    alias: 'p',
    description: 'Target platform',
    choices: ['mac', 'win', 'linux'],
    default: 'all'
  })
  .option('publish', {
    description: 'Publish mode',
    choices: ['always', 'draft', 'never'],
    default: 'never'
  })
  .help()
  .argv;

// Use argv.platform and argv.publish in build logic
```

## Alternative: Vite-Based Build Pipeline

Since we're already using Vite, we can leverage its plugin system for build orchestration. This approach integrates better with the existing Vite workflow.

### Vite Plugin Approach

Create a custom Vite plugin that handles build orchestration:

```javascript
// packages/desktop/vite.config.js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { buildOrchestrator } from './build-orchestrator.js';

export default defineConfig({
  plugins: [
    svelte(),
    buildOrchestrator()
  ],
  
  // ... existing config
});
```

Create the orchestrator plugin:

```javascript
// packages/desktop/build-orchestrator.js
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

export function buildOrchestrator() {
  const root = path.resolve(__dirname, '../..');
  const clientDir = path.join(root, 'packages/client');
  const staticCompiled = path.join(__dirname, 'static-compiled');
  const staticDesktop = path.join(__dirname, 'static-desktop');

  function run(cmd, cwd = __dirname) {
    console.log(`\n> ${cmd}`);
    execSync(cmd, { stdio: 'inherit', cwd });
  }

  return {
    name: 'build-orchestrator',
    
    async buildStart() {
      // Prepare static files
      console.log('Preparing static files...');
      await fs.remove(staticCompiled);
      await fs.copy(path.join(clientDir, 'static'), staticCompiled);
      await fs.copy(staticDesktop, staticCompiled);
      console.log('✓ Static files prepared');
      
      // Build client
      console.log('Building client...');
      run('npm run build -w @sila/client', root);
      console.log('✓ Client built');
    },
    
    async closeBundle() {
      // Build Electron after Vite build completes
      console.log('Building Electron...');
      run('electron-builder');
      console.log('✓ Electron built');
      console.log('\n🎉 Build complete!');
    }
  };
}
```

### Benefits of Vite Plugin Approach

- **Integration**: Seamlessly integrates with existing Vite workflow
- **Hooks**: Can hook into Vite's build lifecycle (`buildStart`, `closeBundle`, etc.)
- **Parallelization**: Can run tasks in parallel with Vite's build process
- **Caching**: Benefits from Vite's caching mechanisms
- **Development**: Can also run during development mode if needed

### Vite Plugin with CLI Options

```javascript
// packages/desktop/build-orchestrator.js
export function buildOrchestrator(options = {}) {
  const { platform = 'all', publish = 'never' } = options;
  
  return {
    name: 'build-orchestrator',
    
    configResolved(config) {
      // Access resolved config if needed
      console.log(`Building for platform: ${platform}, publish: ${publish}`);
    },
    
    async buildStart() {
      // Build orchestration logic
    },
    
    async closeBundle() {
      // Post-build orchestration
      if (platform === 'mac') {
        run('electron-builder --mac');
      } else if (platform === 'win') {
        run('electron-builder --win');
      } else {
        run('electron-builder');
      }
    }
  };
}
```

Update the Vite config to pass options:

```javascript
// packages/desktop/vite.config.js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { buildOrchestrator } from './build-orchestrator.js';

export default defineConfig(({ command, mode }) => {
  const isBuild = command === 'build';
  
  return {
    plugins: [
      svelte(),
      ...(isBuild ? [buildOrchestrator({ platform: 'all' })] : [])
    ],
    // ... rest of config
  };
});
```

### Migration Strategy

1. **Phase 1**: Create the Vite plugin alongside existing scripts
2. **Phase 2**: Test the plugin approach with a subset of build steps
3. **Phase 3**: Gradually migrate all build orchestration to the plugin
4. **Phase 4**: Remove standalone build scripts once migration is complete

### Future Considerations

- **TypeScript**: Consider migrating to TypeScript for better type safety
- **Parallel builds**: Add support for parallel execution where possible
- **Build caching**: Implement caching mechanisms for faster rebuilds
- **Environment detection**: Auto-detect and adapt to different environments
- **Plugin system**: Allow packages to register their own build steps

## Conclusion

Moving to dedicated build scripts will significantly improve maintainability and readability of our build process. The initial investment in creating the build script will pay off as our build logic continues to grow in complexity.

The Vite plugin approach offers better integration with our existing toolchain, while standalone scripts provide more flexibility. Choose based on your preference for integration vs. independence. 