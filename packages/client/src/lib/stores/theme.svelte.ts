import { getCurrentColorScheme } from "$lib/utils/updateColorScheme";

function getInitialThemeName() {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('themeName') || 'rose';
  }
  return 'rose';
}

export const theme = $state({
  colorScheme: getCurrentColorScheme(),
  themeName: getInitialThemeName(),
});

// Update the color scheme based on a new preference
export function updateTheme() {
  theme.colorScheme = getCurrentColorScheme();
}

// Update the themeName and persist it
export function setThemeName(name: string) {
  theme.themeName = name;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('themeName', name);
  }
}
