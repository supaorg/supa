import { Spages } from './Spages.svelte';
import Settings from '../comps/settings/Settings.svelte';
import Spaces from '../comps/settings/Spaces.svelte';

// Create and export the spages instance
export const spages = new Spages();

// Register components that can be used in spages
spages.register('settings', Settings, { 
  // Default props if needed
});
spages.register('spaces', Spaces, { 
  // Default props if needed
});

// Helper functions for common operations
export function openSettings() {
  spages.open('settings', {}, 'Settings');
} 

export function openSpaces() {
  spages.open('spaces', {}, 'Spaces');
} 