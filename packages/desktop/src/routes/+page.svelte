<script lang="ts">
	import { onMount } from 'svelte';
	
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
	
	function handleClick() {
		clickCount++;
	}
</script>

<svelte:head>
	<title>Supa Desktop - SvelteKit + Electron</title>
</svelte:head>

<div class="h-full flex flex-col">
	<!-- Draggable top area - positioned to not interfere with traffic lights -->
	<div class="draggable-area"></div>
	
	<div class="flex-1 container mx-auto p-8 flex flex-col items-center justify-center space-y-8">
		<!-- Header -->
		<header class="text-center draggable-header">
			<h1 class="text-4xl font-bold gradient-heading">
				🚀 Supa Desktop
			</h1>
			<p class="text-lg text-gray-600 dark:text-gray-400">
				SvelteKit + Electron Integration
			</p>
		</header>
		
		<!-- Main content -->
		<main class="max-w-2xl space-y-6">
			<!-- Info card -->
			<div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
				<header class="mb-4">
					<h2 class="text-2xl font-bold text-gray-800 dark:text-white">Welcome to SvelteKit + Electron!</h2>
				</header>
				<section>
					<p class="text-gray-600 dark:text-gray-300">
						This is a SvelteKit application running inside Electron with Tailwind CSS styling.
					</p>
					
					<div class="mt-4">
						<h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-white">System Info:</h3>
						<div class="grid grid-cols-3 gap-4 text-sm">
							<div>
								<strong>Node.js:</strong><br/>
								<code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{electronInfo.node}</code>
							</div>
							<div>
								<strong>Chromium:</strong><br/>
								<code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{electronInfo.chrome}</code>
							</div>
							<div>
								<strong>Electron:</strong><br/>
								<code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{electronInfo.electron}</code>
							</div>
						</div>
					</div>
				</section>
			</div>
			
			<!-- Interactive demo -->
			<div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
				<header class="mb-4">
					<h3 class="text-lg font-semibold text-gray-800 dark:text-white">Interactive Demo</h3>
				</header>
				<section class="text-center">
					<button 
						class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200 non-draggable" 
						on:click={handleClick}
					>
						Click Me!
					</button>
					
					{#if clickCount > 0}
						<p class="mt-4 text-blue-500 font-semibold">
							You've clicked {clickCount} times! 🎉
						</p>
					{/if}
				</section>
			</div>
		</main>
		
		<!-- Footer -->
		<footer class="text-center text-gray-500 dark:text-gray-400">
			<p>This is the foundation for the Tauri → Electron migration</p>
		</footer>
	</div>
</div>

<style>
	.gradient-heading {
		background: linear-gradient(45deg, #3b82f6, #8b5cf6);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	
	.draggable-area {
		-webkit-app-region: drag;
		position: fixed;
		top: 0;
		left: 100px; /* Leave space for traffic lights */
		right: 0;
		height: 30px;
		z-index: 9999;
		background: transparent;
	}
	
	.draggable-header {
		-webkit-app-region: drag;
		-webkit-user-select: none;
		user-select: none;
	}
	
	.non-draggable {
		-webkit-app-region: no-drag;
	}
</style> 