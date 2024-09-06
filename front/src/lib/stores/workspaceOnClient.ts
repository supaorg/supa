import type { Writable } from "svelte/store";
import { writable } from "svelte/store";
import { isTauri, setupServerInTauri } from "$lib/tauri/serverInTauri";
import { subscribeToSession } from "./fsPermissionDeniedStore";
import { apiRoutes } from "@shared/apiRoutes";
import type { AppConfig, Profile, Thread, Workspace } from "@shared/models";
import { Client } from "@shared/neorest/Client";
import { type WorkspacePointer } from "./workspaceStore";

type WorkspaceClientState = "disconnected" | "connecting" | "connected" | "error";

export class WorkspaceOnClient {
  client: Client;
  pointer: WorkspacePointer;
  profile: Writable<Profile | null>;
  threads: Writable<Thread[]>;
  appConfigs: Writable<AppConfig[]>;
  state: Writable<WorkspaceClientState>;

  getId(): string {
    return this.pointer.workspace.id;
  }

  constructor(pointer: WorkspacePointer) {
    this.client = new Client();
    this.pointer = pointer;
    this.profile = writable<Profile | null>(null);
    this.threads = writable<Thread[]>([]);
    this.appConfigs = writable<AppConfig[]>([]);
    this.state = writable<WorkspaceClientState>("disconnected");
  }

  async connect() {
    this.state.set("connecting");

    await this.connectToLocalWorkspace();

    await this.loadProfileFromServer();
    await this.loadThreadsFromServer();
    await this.loadAppConfigsFromServer();

    this.state.set("connected");
  }

  private async connectToLocalWorkspace(): Promise<void> {
    let serverWsUrl = this.pointer ? this.pointer.url : "ws://localhost:6969";

    if (this.client.isConnected() && this.client.getURL() === serverWsUrl) {
      return;
    }

    if (isTauri()) {
      const tauriIntegration = await setupServerInTauri();
      serverWsUrl = tauriIntegration.getWebSocketUrl();
    }

    if (this.client.getURL() !== serverWsUrl) {
      this.client.setUrl(serverWsUrl);
    }

    const res = await this.client.post(apiRoutes.workspaces(), { path: this.pointer.workspace.path, create: false });

    if (res.error) {
      console.error(res.error);
      return;
    }

    const workspace = res.data as Workspace;

    await subscribeToSession();

    if (!workspace) {
      throw new Error("Workspace not found");
    }
  }

  private async loadProfileFromServer() {
    const profile = await this.client.get(apiRoutes.profile(this.getId())).then((res) => {
      if (!res.data) {
        return null;
      }

      return res.data as Profile;
    });

    this.profile.set(profile);
  }

  private async loadThreadsFromServer() {
    const threads = await this.client.get(apiRoutes.threads(this.getId())).then((res) => {
      const threads = Array.isArray(res.data) ? res.data : [];
      // sort by createdAt
      threads.sort((a, b) => {
        return b.createdAt - a.createdAt;
      });
      return threads;
    });

    this.threads.set(threads);

    this.client.on(apiRoutes.threads(this.getId()), (broadcast) => {
      if (broadcast.action === 'POST') {
        const thread = broadcast.data as Thread;
        this.threads.update((threads) => {
          return [thread, ...threads];
        });
      } else if (broadcast.action === 'DELETE') {
        const threadId = broadcast.data as string;
        this.threads.update((threads) => {
          const newThreads = threads.filter((t) => t.id !== threadId);
          return newThreads;
        });
      } else if (broadcast.action === 'UPDATE') {
        const thread = broadcast.data as Thread;
        this.threads.update((threads) => {
          const newThreads = threads.map((t) => {
            if (t.id === thread.id) {
              return thread;
            }
            return t;
          });
          return newThreads;
        });
      }
    });
  }

  private async loadAppConfigsFromServer() {
    const apps = await this.client.get(apiRoutes.appConfigs(this.getId())).then((res) => {
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

    this.appConfigs.set(apps);

    this.client.on(apiRoutes.appConfigs(this.getId()), (broadcast) => {
      if (broadcast.action === "POST" || broadcast.action === "UPDATE") {
        const config = broadcast.data as AppConfig;

        this.appConfigs.update((apps) => {
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

        this.appConfigs.update((apps) => {
          return apps.filter((c) => c.id !== configId);
        });
      }
    });
  }
}


/*
export function setCurrentWorkspace(pointer: WorkspacePointer) {
  // If the current workspace in store is different from the one we are setting - clear stores
  if (getCurrentWorkspace()?.workspace.id !== pointer.workspace.id) {
    console.log("Clearing stores");
    threadsStore.set([]);
    appConfigStore.set([]);
    threadsMessagesStore.set({});
  }

  currentWorkspacePointerStore.set(pointer);

  // Always update or add the workspace to the list
  workspacePointersStore.update((workspaces) => {
    const index = workspaces.findIndex((p) => p.workspace.id === pointer.workspace.id);
    if (index !== -1) {
      // Update existing workspace
      workspaces[index] = pointer;
    } else {
      // Add new workspace
      workspaces.push(pointer);
    }
    return workspaces;
  });
}
*/

/*
export async function connectOrStartServerInTauri(): Promise<void> {
  if (!isTauri()) {
    throw new Error("This function is only available in Tauri.");
  }

  const tauriIntegration = await setupServerInTauri();
  const serverWsUrl = tauriIntegration.getWebSocketUrl();

  if (client.getURL() !== serverWsUrl) {
    client.setUrl(serverWsUrl);
  }

  const serverInfoRes = await client.get(apiRoutes.root);
  if (serverInfoRes.error) {
    throw new Error(serverInfoRes.error);
  }

  //await subscribeToSession();
}
*/

/*
export function setLocalWorkspace(workspace: Workspace) {
  setCurrentWorkspace({
    type: "local",
    url: "http://localhost:6969",
    workspace: workspace,
  });
}
*/