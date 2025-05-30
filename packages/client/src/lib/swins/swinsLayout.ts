import { SWins } from './Swins.svelte';
import Settings from './routes/Settings.svelte';
import Spaces from './routes/Spaces.svelte';
import Apps from './routes/Apps.svelte';
import AppConfigEditing from '$lib/comps/app-configs/AppConfigEditing.svelte';
import NewThreadSwins from './routes/NewThreadSwins.svelte';
import HowToSetupModelProider from '$lib/comps/models/HowToSetupModelProider.svelte';

export const swins = new SWins();

swins.register('settings', Settings);
swins.register('spaces', Spaces);
swins.register('apps', Apps);
swins.register('app-config', AppConfigEditing);
swins.register('new-thread', NewThreadSwins);
swins.register('how-to-setup-model-provider', HowToSetupModelProider);

export function openSettings() {
  swins.open('settings', {}, 'Settings');
} 

export function openSpaces() {
  swins.open('spaces', {}, 'Spaces');
} 