import { get, writable } from "svelte/store";
import { client } from "$lib/tools/client";

export async function subscribeToSession() {
  return client.listen("session", async ({ data }) => {
    const session = data as object;
    if (data && "error" in session && session.error === "fs-permission") {
      fsPermissionDeniedStore.set("fs-permission");
    } else {
      if (get(fsPermissionDeniedStore) === "fs-permission") {
        fsPermissionDeniedStore.set(null);
        // Here we reload the page so the app can setup the workspace correctly
        window.location.reload();
      }
    }
  });
}

export const fsPermissionDeniedStore = writable<string | null>(null);
