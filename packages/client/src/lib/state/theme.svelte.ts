import { getCurrentColorScheme, applyColorSchemeToDocument } from "$lib/utils/updateColorScheme";
import { saveSpaceTheme, saveSpaceColorScheme, getSpaceSetup } from "$lib/localDb";

const DEFAULT_THEME = 'cerberus';
type ColorScheme = 'light' | 'dark';

export class ThemeStore {
  colorScheme: ColorScheme = $state(getCurrentColorScheme());
  themeName: string = $state(DEFAULT_THEME);

  private currentSpaceId: string | null = null;

  // Load theme and color scheme for the current space
  async loadSpaceTheme(currentSpaceId: string | null) {
    this.currentSpaceId = currentSpaceId;

    if (!currentSpaceId) {
      this.setDefaultTheme();
      return;
    }
    
    try {
      const spaceSetup = await getSpaceSetup(currentSpaceId);
      
      // Load theme name
      if (spaceSetup?.theme) {
        this.themeName = spaceSetup.theme;
        document.documentElement.setAttribute("data-theme", spaceSetup.theme);
      } else {
        // If no theme is set for this space, use the default
        this.themeName = DEFAULT_THEME;
        document.documentElement.setAttribute("data-theme", DEFAULT_THEME);
      }
      
      // Load color scheme if available
      if (spaceSetup?.colorScheme) {
        this.colorScheme = spaceSetup.colorScheme;
        this.applyColorScheme(spaceSetup.colorScheme);
      } else {
        // If no color scheme is set for this space, use the system preference
        const systemColorScheme = getCurrentColorScheme();
        this.colorScheme = systemColorScheme;
        this.applyColorScheme(systemColorScheme);
      }
    } catch (error) {
      console.error('Failed to load space theme:', error);
      // Fall back to defaults
      this.setDefaultTheme();
    }
  }

  private setDefaultTheme() {
    this.themeName = DEFAULT_THEME;
    this.colorScheme = getCurrentColorScheme();
    document.documentElement.setAttribute("data-theme", DEFAULT_THEME);
    this.applyColorScheme(this.colorScheme);
  }

  // Apply the color scheme to the document
  private applyColorScheme(colorScheme: ColorScheme) {
    applyColorSchemeToDocument(colorScheme);
  }

  // Update the themeName and persist it to the current space
  async setThemeName(name: string) {
    this.themeName = name;
    document.documentElement.setAttribute("data-theme", name);
    
    // Save to the current space if available
    if (this.currentSpaceId) {
      await saveSpaceTheme(this.currentSpaceId, name);
    }
  }

  // Update the color scheme and persist it to the current space
  async setColorScheme(colorScheme: ColorScheme) {
    this.colorScheme = colorScheme;
    this.applyColorScheme(colorScheme);
    
    // Save to the current space if available
    if (this.currentSpaceId) {
      await saveSpaceColorScheme(this.currentSpaceId, colorScheme);
    }
  }
}
