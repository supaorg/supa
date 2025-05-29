<script lang="ts">
  let themes = [
    { name: "catppuccin", emoji: "🐈" },
    { name: "cerberus", emoji: "🐺" },
    { name: "concord", emoji: "🤖" },
    { name: "crimson", emoji: "🔴" },
    { name: "fennec", emoji: "🦊" },
    { name: "hamlindigo", emoji: "👔" },
    { name: "legacy", emoji: "💀" },
    { name: "mint", emoji: "🍃" },
    { name: "modern", emoji: "🌸" },
    { name: "mona", emoji: "🐙" },
    { name: "nosh", emoji: "🥙" },
    { name: "nouveau", emoji: "👑" },
    { name: "pine", emoji: "🌲" },
    { name: "reign", emoji: "📒" },
    { name: "rocket", emoji: "🚀" },
    { name: "rose", emoji: "🌷" },
    { name: "sahara", emoji: "🏜️" },
    { name: "seafoam", emoji: "🧜‍♀️" },
    { name: "terminus", emoji: "🌑" },
    { name: "vintage", emoji: "📺" },
    { name: "vox", emoji: "👾" },
    { name: "wintry", emoji: "🌨️" },
  ];

  import { theme, setThemeName, setColorScheme, loadSpaceTheme } from "$lib/stores/theme.svelte";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import { onMount } from "svelte";
  import { Sun, Moon } from "lucide-svelte";

  onMount(async () => {
    // Load theme for current space if available
    if (spaceStore.currentSpaceId) {
      await loadSpaceTheme();
    }
  });

  // Use $effect directly at component scope to watch for space changes
  $effect(() => {
    // This will re-run whenever currentSpaceId changes
    const currentSpaceId = spaceStore.currentSpaceId;
    if (currentSpaceId) {
      loadSpaceTheme();
    }
  });

  async function handleThemeClick(name: string) {
    await setThemeName(name);
  }

  async function toggleColorScheme() {
    const newColorScheme = theme.colorScheme === 'dark' ? 'light' : 'dark';
    await setColorScheme(newColorScheme);
  }
</script>

<div class="mb-4">
  <div class="flex justify-between items-center mb-2">
    <h2 class="text-xl font-semibold">Color Mode</h2>
    <button
      class="btn variant-filled-primary p-2 flex items-center gap-2"
      onclick={toggleColorScheme}
      aria-label={theme.colorScheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {#if theme.colorScheme === 'dark'}
        <Sun size={18} />
        <span>Light Mode</span>
      {:else}
        <Moon size={18} />
        <span>Dark Mode</span>
      {/if}
    </button>
  </div>
  <div class="text-sm text-surface-600-300 mb-6">
    Choose your preferred color mode. This setting is saved per space.
  </div>
</div>

<div class="mb-4">
  <h2 class="text-xl font-semibold mb-2">Theme</h2>
  <div class="text-sm text-surface-600-300 mb-4">
    Select a color theme for your space.
  </div>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
  {#each themes as skeletonTheme}
    <button
      data-theme={skeletonTheme.name}
      class="w-full bg-surface-50-950 p-2 preset-outlined-surface-100-900 rounded-md grid grid-cols-[auto_1fr_auto] items-center gap-4 {theme.themeName ===
      skeletonTheme.name
        ? 'border-2 border-primary-500'
        : 'border-2 border-transparent'}"
      onclick={() => handleThemeClick(skeletonTheme.name)}
      aria-pressed={theme.themeName === skeletonTheme.name}
    >
      <span>{skeletonTheme.emoji}</span>
      <h3 class="text-lg capitalize cap text-left">{skeletonTheme.name}</h3>
      <div class="flex justify-center items-center -space-x-1">
        <div
          class="aspect-square w-4 bg-primary-500 border-[1px] border-black/10 rounded-full"
        ></div>
        <div
          class="aspect-square w-4 bg-secondary-500 border-[1px] border-black/10 rounded-full"
        ></div>
        <div
          class="aspect-square w-4 bg-tertiary-500 border-[1px] border-black/10 rounded-full"
        ></div>
        <div
          class="aspect-square w-4 bg-success-500 border-[1px] border-black/10 rounded-full"
        ></div>
        <div
          class="aspect-square w-4 bg-warning-500 border-[1px] border-black/10 rounded-full"
        ></div>
        <div
          class="aspect-square w-4 bg-error-500 border-[1px] border-black/10 rounded-full"
        ></div>
        <div
          class="aspect-square w-4 bg-surface-500 border-[1px] border-black/10 rounded-full"
        ></div>
      </div>
    </button>
  {/each}
</div>
