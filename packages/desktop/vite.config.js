import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	
	// Configure for Electron compatibility
	server: {
		port: 5173,
		strictPort: true
	},
	
	// Ensure proper base path for electron
	base: './',
	
	// Build configuration
	build: {
		outDir: 'build',
		emptyOutDir: true,
		// Ensure compatibility with Electron
		target: 'chrome120'
	},
	
	// Define globals for Electron context
	define: {
		global: 'globalThis'
	}
}); 