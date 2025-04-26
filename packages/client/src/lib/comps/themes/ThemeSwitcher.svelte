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

  import { theme, setThemeName } from "$lib/stores/theme.svelte";
  import { onMount } from "svelte";

  function handleThemeClick(name: string) {
    setThemeName(name);
    document.documentElement.setAttribute("data-theme", name);
  }

  onMount(() => {
    // Ensure the HTML data-theme matches the store value on load
    if (theme.themeName) {
      document.documentElement.setAttribute("data-theme", theme.themeName);
    }
  });
</script>

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
