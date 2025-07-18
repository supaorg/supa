import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// @NOTE: at the moment this is almost a copy of the desktop config

export default defineConfig({
	plugins: [sveltekit()],

	// Build configuration
	build: {
		outDir: 'build',
		emptyOutDir: true,
		// Ensure compatibility with Electron
		target: 'chrome120',
		sourcemap: true // Enable source maps for debugging
	},

	// Ensure source maps work properly for debugging
	css: {
		devSourcemap: true
	},
	
	// Resolve configuration for monorepo debugging
	resolve: {
		preserveSymlinks: true
	}
}); 