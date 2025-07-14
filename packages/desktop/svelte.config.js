import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
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
		
		// Configure paths for Electron - empty string for development, relative path for production
		paths: {
			base: process.env.NODE_ENV === 'production' ? '' : ''
		},
		
		// Prerender all pages for static generation
		prerender: {
			handleHttpError: 'warn'
		},
		
		// Path aliases for importing from client package
		alias: {
			'@client': '../client/src/lib'
		}
	}
};

export default config; 