<script lang="ts">
  import { browser } from "$app/environment";
  import {
    COLOR_SCHEMA_STORAGE_KEY,
    getCurrentColorScheme,
    getOSColorScheme,
    updateColorScheme,
  } from "$lib/utils/updateColorScheme";
  import { Moon, Sun } from "lucide-svelte";

  let { tiny = false } = $props();

  let currentColorScheme = $state("light");

  if (browser) {
    currentColorScheme = getCurrentColorScheme();
  }

  function handleSwitch() {
    const setColorScheme = getCurrentColorScheme();
    const osColorScheme = getOSColorScheme();
    const targetColorScheme = setColorScheme === "dark" ? "light" : "dark";

    if (osColorScheme === targetColorScheme) {
      localStorage.removeItem(COLOR_SCHEMA_STORAGE_KEY);
    } else {
      localStorage.setItem(COLOR_SCHEMA_STORAGE_KEY, targetColorScheme);
    }

    currentColorScheme = targetColorScheme;

    updateColorScheme();
  }

  function changeColorScheme() {
    if (currentColorScheme === "system") {
      localStorage.removeItem(COLOR_SCHEMA_STORAGE_KEY);
    } else if (currentColorScheme === "dark") {
      localStorage.setItem(COLOR_SCHEMA_STORAGE_KEY, "dark");
    } else if (currentColorScheme === "light") {
      localStorage.setItem(COLOR_SCHEMA_STORAGE_KEY, "light");
    }

    updateColorScheme();
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
