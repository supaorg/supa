import { type Writable, writable } from "svelte/store";
import { localStorageStore } from "@skeletonlabs/skeleton";
import { client } from "$lib/tools/client";
import type { AppConfig } from "@shared/models";
import { apiRoutes } from "@shared/apiRoutes";
import { getCurrentWorkspaceId } from "./workspaceStore";

export const appConfigStore: Writable<AppConfig[]> = localStorageStore(
  "app-configs",
  [],
);

export const visibleAppConfigStore = writable<AppConfig[]>([]);

appConfigStore.subscribe((apps) => {
  const visibleApps = apps.filter((a) => {
    if (a.meta && a.meta.visible === "false") {
      return false;
    }
    return true;
  });
  visibleAppConfigStore.set(visibleApps);
});

export async function createAppConfig() {
  const app = await client.post(apiRoutes.appConfigs(getCurrentWorkspaceId())).then((res) => {
    return res.data as AppConfig;
  });

  return app;
}

export async function loadAppConfigsFromServer() {
  const apps = await client.get(apiRoutes.appConfigs(getCurrentWorkspaceId())).then((res) => {
    const apps = Array.isArray(res.data) ? res.data as AppConfig[] : [];
    // sort by name
    apps.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
    return apps;
  });

  appConfigStore.set(apps);

  client.on(apiRoutes.appConfigs(getCurrentWorkspaceId()), (broadcast) => {
    if (broadcast.action === "POST" || broadcast.action === "UPDATE") {
      const config = broadcast.data as AppConfig;

      appConfigStore.update((apps) => {
        // Check if we need to update or add the config
        const index = apps.findIndex((c) => c.id === config.id);
        if (index === -1) {
          apps.push(config);
        } else {
          apps[index] = config;
        }

        return apps;
      });
    } else if (broadcast.action === "DELETE") {
      const configId = broadcast.data as string;

      appConfigStore.update((apps) => {
        return apps.filter((c) => c.id !== configId);
      });
    }
  });
}
