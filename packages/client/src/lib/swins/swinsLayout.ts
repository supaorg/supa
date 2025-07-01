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

// Setup function that can configure any SWins instance
export function setupSwins(swinsInstance: SWins): SWins {
  swinsInstance.register('settings', Settings);
  swinsInstance.register('spaces', Spaces);
  swinsInstance.register('apps', Apps);
  swinsInstance.register('app-config', AppConfigEditing);
  swinsInstance.register('new-thread', NewThreadSwins);
  swinsInstance.register('how-to-setup-model-provider', HowToSetupModelProider);
  swinsInstance.register('select-model', SelectModelPopup);
  swinsInstance.register('custom-provider-setup', CustomProviderSetup);
  swinsInstance.register('model-providers', ModelProviders);
  swinsInstance.register('sign-in', SignInButtons);
  swinsInstance.register('user-profile', UserProfile);
  
  return swinsInstance;
}