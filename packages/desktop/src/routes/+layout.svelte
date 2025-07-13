<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	
	// Check if running in Electron
	let isElectron = false;
	
	onMount(() => {
		// Check if we're running in Electron
		isElectron = !!(window as any).electronAPI || navigator.userAgent.includes('Electron');
		
		// Log environment info
		console.log('Running in Electron:', isElectron);
		console.log('User Agent:', navigator.userAgent);
	});
</script>

<div class="app h-full">
	<slot />
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
</style> 