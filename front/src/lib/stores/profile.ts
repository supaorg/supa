import type { Writable } from 'svelte/store';
import { get } from 'svelte/store';
import { localStorageStore } from '@skeletonlabs/skeleton';
import { client } from '$lib/tools/client';
import type { Profile } from '@shared/models';

export const profileStore: Writable<Profile | null> = localStorageStore('profile', null);

export async function updateProfile(profile: Partial<Profile>) {
  // Merge the new profile with the existing one
  const currentProfile = get(profileStore);
  const updProfile = {
    ...currentProfile,
    ...profile,
  } as Profile;
  await client.post("profile", updProfile);
}

export async function loadProfileFromServer() {
  let profile = await client.get("profile").then((res) => {
    if (!res.data) {
      return null;
    }

    return res.data as Profile;
  });

  profileStore.set(profile);

  client.listen("profile", (broadcast) => {
    if (broadcast.action === 'UPDATE') {
      const profile = broadcast.data as Profile;
      profileStore.set(profile);
    }
  });
}