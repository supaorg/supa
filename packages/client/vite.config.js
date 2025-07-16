import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

export default defineConfig(() => ({
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
      plugins: [peerDepsExternal()],
      // Always preserve individual modules for faster rebuilds
      preserveModules: true,
      preserveModulesRoot: 'src',
      // Externalize Svelte runtime as well
      external: id => id === 'svelte' || id.startsWith('svelte/'),
    }
  }
}));
