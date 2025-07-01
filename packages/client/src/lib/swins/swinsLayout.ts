import { SWins } from './Swins.svelte';
import Settings from './routes/Settings.svelte';
import Spaces from './routes/Spaces.svelte';
import Apps from './routes/Apps.svelte';
import AppConfigEditing from '$lib/comps/app-configs/AppConfigEditing.svelte';
import NewThreadSwins from './routes/NewThreadSwins.svelte';
import HowToSetupModelProider from '$lib/comps/models/HowToSetupModelProider.svelte';
import SelectModelPopup from '$lib/comps/popups/SelectModelPopup.svelte';
import CustomProviderSetup from '$lib/comps/models/CustomProviderSetup.svelte';
import ModelProviders from '$lib/comps/models/ModelProviders.svelte';
import SignInButtons from '$lib/comps/auth/SignInButtons.svelte';
import UserProfile from '$lib/comps/auth/UserProfile.svelte';
import FreshStartWizard from '$lib/comps/wizards/FreshStartWizard.svelte';

// Setup function that can configure any SWins instance
export function setupSwins(): SWins {
  const swins = new SWins();

  swins.register('fresh-start', FreshStartWizard);
  swins.register('settings', Settings);
  swins.register('spaces', Spaces);
  swins.register('apps', Apps);
  swins.register('app-config', AppConfigEditing);
  swins.register('new-thread', NewThreadSwins);
  swins.register('how-to-setup-model-provider', HowToSetupModelProider);
  swins.register('select-model', SelectModelPopup);
  swins.register('custom-provider-setup', CustomProviderSetup);
  swins.register('model-providers', ModelProviders);
  swins.register('sign-in', SignInButtons);
  swins.register('user-profile', UserProfile);

  return swins;
}