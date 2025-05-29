export const DARK_MODE_MATCH_MEDIA_STR = "(prefers-color-scheme: dark)"; 
export const COLOR_SCHEMA_STORAGE_KEY = "colorScheme";

// This function applies the color scheme to the document without updating the theme store
// to avoid circular dependencies
export function applyColorSchemeToDocument(colorScheme: 'dark' | 'light') {
  if (colorScheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// This function is used on initial load before the theme store is initialized
export function updateColorScheme(): 'dark' | 'light' {
  let colorScheme: 'dark' | 'light' = 'dark';

  // Get the user's theme preference from local storage
  const savedColorScheme = localStorage.getItem(COLOR_SCHEMA_STORAGE_KEY);

  if (savedColorScheme && (savedColorScheme === 'dark' || savedColorScheme === 'light')) {
    colorScheme = savedColorScheme;
  }
  else {
    const darkModeIsOnInOS = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    colorScheme = darkModeIsOnInOS ? 'dark' : 'light';
  }

  // Apply the color scheme to the document
  applyColorSchemeToDocument(colorScheme);
  
  // Return the determined color scheme
  return colorScheme;
}

export function getCurrentColorScheme(): 'dark' | 'light' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function getOSColorScheme(): 'dark' | 'light' {
  const darkModeIsOnInOS = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return darkModeIsOnInOS ? 'dark' : 'light';
}