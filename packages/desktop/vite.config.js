import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	
	// Configure for Electron compatibility
	server: {
		port: 6969,
		strictPort: true
	},
	
	// Ensure proper base path for electron
	base: './',
	
	// Build configuration
	build: {
		outDir: 'build',
		emptyOutDir: true,
		// Ensure compatibility with Electron
		target: 'chrome120',
		sourcemap: true // Enable source maps for debugging
	},
	
	// Define globals for Electron context
	define: {
		global: 'globalThis'
	},
	
	// Ensure source maps work properly for debugging
	css: {
		devSourcemap: true
	},
	
	// Path resolution for importing from client package
	resolve: {
		alias: {
			'@client': '../client/src/lib'
		}
	}
}); 