import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte'],
	preprocess: [vitePreprocess()],
	
	kit: {
		adapter: adapter(),
    alias: {
      '@shared': '../shared',
    }
	}
};
export default config;