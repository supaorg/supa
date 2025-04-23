import { getCurrentColorScheme } from "$lib/utils/updateColorScheme";

export const theme = $state({
  colorScheme: getCurrentColorScheme(),
});

// Update the theme based on a new preference
export function updateTheme() {
  theme.colorScheme = getCurrentColorScheme();
}
