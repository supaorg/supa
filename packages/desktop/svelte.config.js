import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    // adapter-static for Electron compatibility
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: false
    }),

    // For the dev experience, we define those in the root tsconfig.json
    // and for builds - define them as aliases here.
    // .svelte-kit/tsconfig.json will get those automatically from "svelte-kit sync".
    alias: {
      "@supa/client": "../client/src/lib",
      "@supa/core": "../core/src",
    },

    // Configure paths for Electron - empty string for development, relative path for production
    paths: {
      base: process.env.NODE_ENV === 'production' ? '' : ''
    },

    // Prerender all pages for static generation
    prerender: {
      handleHttpError: 'warn'
    }
  }
};

export default config; 