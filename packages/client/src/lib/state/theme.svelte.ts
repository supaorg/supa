import { getCurrentColorScheme, applyColorSchemeToDocument } from "$lib/utils/updateColorScheme";
import { saveSpaceTheme, saveSpaceColorScheme, getSpaceSetup } from "$lib/localDb";
import { spaceStore } from "$lib/state/spaceStore.svelte";

const DEFAULT_THEME = 'cerberus';
type ColorScheme = 'light' | 'dark';

// Initialize with default values, will be updated when space loads
export const theme = $state({
  colorScheme: getCurrentColorScheme(),
  themeName: DEFAULT_THEME,
});

// Load theme and color scheme for the current space
export async function loadSpaceTheme() {
  if (!spaceStore.currentSpaceId) {
    setDefaultTheme();
    return;
  }
  
  try {
    const spaceSetup = await getSpaceSetup(spaceStore.currentSpaceId);
    
    // Load theme name
    if (spaceSetup?.theme) {
      theme.themeName = spaceSetup.theme;
      document.documentElement.setAttribute("data-theme", spaceSetup.theme);
    } else {
      // If no theme is set for this space, use the default
      theme.themeName = DEFAULT_THEME;
      document.documentElement.setAttribute("data-theme", DEFAULT_THEME);
    }
    
    // Load color scheme if available
    if (spaceSetup?.colorScheme) {
      theme.colorScheme = spaceSetup.colorScheme;
      applyColorScheme(spaceSetup.colorScheme);
    } else {
      // If no color scheme is set for this space, use the system preference
      const systemColorScheme = getCurrentColorScheme();
      theme.colorScheme = systemColorScheme;
      applyColorScheme(systemColorScheme);
    }
  } catch (error) {
    console.error('Failed to load space theme:', error);
    // Fall back to defaults
    setDefaultTheme();
  }
}

function setDefaultTheme() {
  theme.themeName = DEFAULT_THEME;
  theme.colorScheme = getCurrentColorScheme();
  document.documentElement.setAttribute("data-theme", DEFAULT_THEME);
  applyColorScheme(theme.colorScheme);
}

// Apply the color scheme to the document
function applyColorScheme(colorScheme: ColorScheme) {
  applyColorSchemeToDocument(colorScheme);
}

// Update the themeName and persist it to the current space
export async function setThemeName(name: string) {
  theme.themeName = name;
  document.documentElement.setAttribute("data-theme", name);
  
  // Save to the current space if available
  if (spaceStore.currentSpaceId) {
    await saveSpaceTheme(spaceStore.currentSpaceId, name);
  }
}

// Update the color scheme and persist it to the current space
export async function setColorScheme(colorScheme: ColorScheme) {
  theme.colorScheme = colorScheme;
  applyColorScheme(colorScheme);
  
  // Save to the current space if available
  if (spaceStore.currentSpaceId) {
    await saveSpaceColorScheme(spaceStore.currentSpaceId, colorScheme);
  }
}
