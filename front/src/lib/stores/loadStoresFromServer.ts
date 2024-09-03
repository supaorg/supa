import { loadProfileFromServer } from './profileStore';
import { loadThreadsFromServer } from './threadStore';
import { loadAppConfigsFromServer } from './appConfigStore';

export default async function loadStoresFromServer() {
  return Promise.all([
    loadProfileFromServer(),
    loadThreadsFromServer(),
    loadAppConfigsFromServer(),
  ]);
}