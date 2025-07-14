import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	
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
	}
}); 