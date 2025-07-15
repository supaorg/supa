<script lang="ts">
	import { onMount } from "svelte";
	import { SupaApp } from "@supa/client";
	
	// Demo state
	let electronInfo = {
		node: '',
		chrome: '',
		electron: ''
	};
	
	let clickCount = 0;
	
	onMount(() => {
		// Get version info if available
		if (typeof process !== 'undefined' && process.versions) {
			electronInfo = {
				node: process.versions.node || 'N/A',
				chrome: process.versions.chrome || 'N/A',
				electron: process.versions.electron || 'N/A'
			};
		}
	});
</script>

<svelte:head>
	<title>Supa</title>
</svelte:head>

<SupaApp />