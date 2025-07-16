import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { readFileSync } from 'node:fs';

// Read this package's package.json to automatically externalize every declared dep
const pkgJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
);

const externalDeps = [
  // Everything declared as (runtime) dependency
  ...Object.keys(pkgJson.dependencies || {}),
  // Everything declared as peer dependency
  ...Object.keys(pkgJson.peerDependencies || {}),
  // Always leave Svelte to the consumer – both runtime and compile-time helpers
  /^svelte/
];

export default defineConfig({
  plugins: [tailwindcss(), svelte()],

  resolve: {
    alias: {
      $lib: path.resolve(__dirname, 'src/lib')
    }
  },

  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,

    lib: {
      entry: 'src/lib/index.ts',
      formats: ['es'],
      fileName: 'index'
    },

    rollupOptions: {
      // Externalize peer dependencies and internal packages
      external: externalDeps,
      output: {
        assetFileNames: (assetInfo) =>
          assetInfo.name === 'style.css' || assetInfo.name === 'index.css'
            ? 'style.css'
            : assetInfo.name ?? '[name].[ext]'
      }
    }
  }
});
