import { Spages } from './Spages.svelte';
import Settings from './routes/Settings.svelte';
import Spaces from './routes/Spaces.svelte';
import Apps from './routes/Apps.svelte';
import AppConfigEditing from '$lib/comps/app-configs/AppConfigEditing.svelte';
import NewThread from './routes/NewThread.svelte';

// Create and export the spages instance
export const spages = new Spages();

// Register components that can be used in spages
spages.register('settings', Settings, { 
  // Default props if needed
});
spages.register('spaces', Spaces, { 
  // Default props if needed
});

spages.register('apps', Apps, { 
  // Default props if needed
});

spages.register('app-config', AppConfigEditing, { 
  // Default props if needed
});

spages.register('new-thread', NewThread, { 
});

// Helper functions for common operations
export function openSettings() {
  spages.open('settings', {}, 'Settings');
} 

export function openSpaces() {
  spages.open('spaces', {}, 'Spaces');
} 