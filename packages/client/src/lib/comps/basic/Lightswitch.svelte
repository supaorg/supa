<script lang="ts">
  import { browser } from "$app/environment";
  import {
    getOSColorScheme,
  } from "$lib/utils/updateColorScheme";
  import { theme, setColorScheme } from "$lib/stores/theme.svelte";
  import { Moon, Sun } from "lucide-svelte";
  import { onMount } from "svelte";

  let { tiny = false } = $props();

  // Track the current color scheme selection (light, dark, or system)
  let currentColorScheme = $state<"light" | "dark" | "system">("system");

  // Initialize the UI selection based on the current theme state
  onMount(() => {
    // If the theme's colorScheme matches the OS preference, show as "system"
    const osColorScheme = getOSColorScheme();
    if (theme.colorScheme === osColorScheme) {
      currentColorScheme = "system";
    } else {
      currentColorScheme = theme.colorScheme;
    }
  });

  // Handle the toggle button click (tiny mode)
  async function handleSwitch() {
    const targetColorScheme = theme.colorScheme === "dark" ? "light" : "dark";
    await setColorScheme(targetColorScheme);
    currentColorScheme = targetColorScheme;
  }

  // Handle the dropdown selection change
  async function changeColorScheme() {
    if (currentColorScheme === "system") {
      // Use the OS preference
      const osColorScheme = getOSColorScheme();
      await setColorScheme(osColorScheme);
    } else {
      // Use the explicitly selected scheme
      await setColorScheme(currentColorScheme);
    }
  }
</script>

{#if tiny}
  <button
    class="cursor-pointer"
    onclick={handleSwitch}
    title={currentColorScheme === "dark"
      ? "Switch to Light mode"
      : "Switch to Dark mode"}
  >
    {#if currentColorScheme === "dark"}
      <Sun size={18} />
    {:else}
      <Moon size={18} />
    {/if}
  </button>
{:else}
  <select
    class="select"
    bind:value={currentColorScheme}
    onchange={changeColorScheme}
  >
    <option value="system">System</option>
    <option value="dark">Dark</option>
    <option value="light">Light</option>
  </select>
{/if}
