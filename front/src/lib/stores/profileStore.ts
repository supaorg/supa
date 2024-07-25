import type { Writable } from "svelte/store";
import { get } from "svelte/store";
import { localStorageStore } from "@skeletonlabs/skeleton";
import { client } from "$lib/tools/client";
import type { Profile } from "@shared/models";
import { routes } from "@shared/routes/routes";

export const profileStore: Writable<Profile | null> = localStorageStore(
  "profile",
  null,
);

export async function updateProfile(profile: Partial<Profile>) {
  // Merge the new profile with the existing one
  const currentProfile = get(profileStore);
  const updProfile = {
    ...currentProfile,
    ...profile,
  } as Profile;
  await client.post(routes.profile, updProfile);
}

export async function loadProfileFromServer() {
  let profile = await client.get(routes.profile).then((res) => {
    if (!res.data) {
      return null;
    }

    return res.data as Profile;
  });

  profileStore.set(profile);

  client.on(routes.profile, (broadcast) => {
    const profile = broadcast.data as Profile;
    profileStore.set(profile);
  });
}
