import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

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
      external: ['@supa/core', /^svelte/],
      output: {
        assetFileNames: (assetInfo) =>
          assetInfo.name === 'style.css' || assetInfo.name === 'index.css'
            ? 'style.css'
            : assetInfo.name ?? '[name].[ext]'
      }
    }
  }
});
