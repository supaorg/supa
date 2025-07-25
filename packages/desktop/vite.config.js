import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
	plugins: [svelte()],
	
	// Ensure proper base path for electron
	base: './',
	
	// Build configuration
	build: {
		outDir: 'build',
		emptyOutDir: true,
		// Ensure compatibility with Electron
		target: 'chrome120',
		sourcemap: true,
    cssMinify: false
	},
	
	// Define globals for Electron context
	define: {
		global: 'globalThis'
	}
}); 