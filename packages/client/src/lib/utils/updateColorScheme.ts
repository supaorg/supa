import { updateTheme } from "$lib/stores/theme.svelte";

export const DARK_MODE_MATCH_MEDIA_STR = "(prefers-color-scheme: dark)"; 
export const COLOR_SCHEMA_STORAGE_KEY = "colorScheme";

export function updateColorScheme() {
  let colorScheme = 'dark';

  // Get the user's theme preference form local storage
  const savedColorScheme = localStorage.getItem(COLOR_SCHEMA_STORAGE_KEY);

  if (savedColorScheme) {
    colorScheme = savedColorScheme;
  }
  else {
    const darkModeIsOnInOS = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    colorScheme = darkModeIsOnInOS ? 'dark' : 'light';
  }

  if (colorScheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  updateTheme();
}

export function getCurrentColorScheme(): 'dark' | 'light' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function getOSColorScheme(): 'dark' | 'light' {
  const darkModeIsOnInOS = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return darkModeIsOnInOS ? 'dark' : 'light';
}