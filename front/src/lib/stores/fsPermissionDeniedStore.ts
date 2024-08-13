import { get, writable } from "svelte/store";
import { client } from "$lib/tools/client";
import { apiRoutes } from "@shared/apiRoutes";

export async function subscribeToSession() {
  return client.on(apiRoutes.session, async ({ data }) => {
    const session = data as object;
    if (data && "error" in session && session.error === "fs-permission") {
      fsPermissionDeniedStore.set(true);
    } else {
      if (get(fsPermissionDeniedStore)) {
        fsPermissionDeniedStore.set(false);
        // Here we reload the page so the app can setup the workspace correctly
        window.location.reload();
      }
    }
  });
}

export const fsPermissionDeniedStore = writable<boolean>(false);
