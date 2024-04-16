<script lang="ts">
  import { browser } from "$app/environment";
  import {
    COLOR_SCHEMA_STORAGE_KEY,
    getCurrentColorScheme,
    getOSColorScheme,
    updateColorScheme,
  } from "$lib/utils/updateColorScheme";
  import { Icon, Moon, Sun } from "svelte-hero-icons";

  let currentColorScheme = "light";

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

  if (browser) {
    currentColorScheme = getCurrentColorScheme();
  }
</script>

<button
  class="cursor-pointer"
  on:click={handleSwitch}
  title={currentColorScheme === "dark"
    ? "Switch to Light mode"
    : "Switch to Dark mode"}
>
  {#if currentColorScheme === "dark"}
    <Icon src={Sun} class="w-4 h-4" micro />
  {:else}
    <Icon src={Moon} class="w-4 h-4" micro />
  {/if}
</button>
