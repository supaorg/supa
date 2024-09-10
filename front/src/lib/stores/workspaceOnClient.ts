import type { Writable } from "svelte/store";
import { get, writable } from "svelte/store";
import { isTauri, setupServerInTauri } from "$lib/tauri/serverInTauri";
//import { subscribeToSession } from "./fsPermissionDeniedStore";
import { apiRoutes } from "@shared/apiRoutes";
import type { AppConfig, ModelProvider, ModelProviderConfig, Profile, Thread, ThreadMessage, Workspace } from "@shared/models";
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

    //await subscribeToSession();

    if (!workspace) {
      throw new Error("Workspace not found");
    }
  }

  getUIName(): string {
    let name = this.pointer.workspace.name;

    if (!name) {
      // Get it from the last folder in the path
      name = this.pointer.workspace.path.split("/").pop() || "Workspace";
    }

    return name;
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

  async setupWorkspace() {
    // @TODO: rethink this

    const res = await this.client.post(apiRoutes.setup(this.getId()), {
      name: "user name",
    });

    if (res.error) {
      throw new Error(res.error);
    }

    return res.data as Profile;
  }

  async getAppConfig(appConfigId: string) {
    const res = await this.client.get(apiRoutes.appConfig(this.getId(), appConfigId));
    return res.data as AppConfig;
  }

  async newAppConfig(appConfig: AppConfig) {
    const res = await this.client.post(apiRoutes.appConfigs(this.getId()), appConfig);
    return res.data as AppConfig;
  }

  async updateAppConfig(appConfig: AppConfig) {
    const res = await this.client.post(apiRoutes.appConfig(this.getId(), appConfig.id), appConfig);
    return res.data as AppConfig;
  }

  async deleteAppConfig(appConfigId: string) {
    await this.client.delete(apiRoutes.appConfig(this.getId(), appConfigId));

    this.appConfigs.update((apps) => {
      return apps.filter((c) => c.id !== appConfigId);
    });
  }

  async getAppConfigForThread(threadId: string): Promise<AppConfig | null> {
    const thread = get(this.threads).find((t) => t.id === threadId);
    if (thread && thread.appConfigId) {
      const appConfig = get(this.appConfigs).find((c) => c.id === thread.appConfigId);
      if (appConfig) {
        return appConfig;
      }
      const res = await this.client.get(apiRoutes.appConfig(this.getId(), thread.appConfigId));
      return res.data as AppConfig;
    }
    return null;
  }

  async changeAppConfig(threadId: string, appConfigId: string): Promise<void> {
    await this.client.post(apiRoutes.thread(this.getId(), threadId), {
      appConfigId: appConfigId,
    });

    this.threads.update((threads) => {
      const threadIndex = threads.findIndex((t) => t.id === threadId);
      if (threadIndex !== -1) {
        threads[threadIndex].appConfigId = appConfigId;
      }
      return threads;
    });
  }

  async createThread(appConfigId: string) {
    const thread = await this.client.post(apiRoutes.threads(this.getId()), appConfigId).then((res) => {
      return res.data as Thread;
    });

    this.threads.update((threads) => {
      return [...threads, thread];
    });

    return thread;
  }

  async retryThread(threadId: string) {
    await this.client.post(apiRoutes.retryThread(this.getId(), threadId));
  }

  async postToThread(threadId: string, message: ThreadMessage) {
    await this.client.post(apiRoutes.threadMessages(this.getId(), threadId), message);
  }

  async deleteThread(threadId: string) {
    await this.client.delete(apiRoutes.thread(this.getId(), threadId));
    this.threads.update((threads) => {
      return threads.filter((t) => t.id !== threadId);
    });
  }

  async getModelProvider(modelProviderId: string) {
    const res = await this.client.get(apiRoutes.provider(this.getId(), modelProviderId));
    return res.data as ModelProvider;
  }

  async saveModelProviderConfig(modelProvider: ModelProviderConfig) {
    await this.client.post(apiRoutes.providerConfigs(this.getId()), modelProvider);
  }

  async getModelProviders() {
    const res = await this.client.get(apiRoutes.providers(this.getId()));
    return res.data as ModelProvider[];
  }

  async getModelsForProvider(modelProviderId: string) {
    const res = await this.client.get(apiRoutes.providerModel(this.getId(), modelProviderId));
    return res.data as string[];
  }

  async deleteModelProviderConfig(modelProviderId: string) {
    await this.client.delete(apiRoutes.providerConfig(this.getId(), modelProviderId));
  }

  async getModelProviderConfig(modelProviderId: string) {
    const res = await this.client.get(apiRoutes.providerConfig(this.getId(), modelProviderId));
    return res.data as ModelProviderConfig;
  }

  async getModelProviderConfigs() {
    const res = await this.client.get(apiRoutes.providerConfigs(this.getId()));
    return res.data as ModelProviderConfig[];
  }

  async validateModelProviderConfig(modelProviderId: string) {
    const res = await this.client.post(apiRoutes.validateProviderConfig(this.getId(), modelProviderId));
    return res.data as boolean;
  }

  async validateModelProviderKey(modelProviderId: string, key: string) {
    const res = await this.client.post(apiRoutes.validateProviderKey(this.getId(), modelProviderId), key);
    return res.data as boolean;
  }


  async getThreadMessages(threadId: string): Promise<ThreadMessage[]> {
    const res = await this.client.get(apiRoutes.threadMessages(this.getId(), threadId));
    return res.data as ThreadMessage[];
  }

  async stopThread(threadId: string) {
    await this.client.post(apiRoutes.stopThread(this.getId(), threadId));
  }

  subscribeToThreadMessages(threadId: string, callback: (message: ThreadMessage) => void) {
    this.client.on(apiRoutes.threadMessages(this.getId(), threadId), (broadcast) => {
      if (broadcast.action === 'POST') {
        const newMessage = broadcast.data as ThreadMessage;
        callback(newMessage);
      }
    });
  }

  unsubscribeFromThreadMessages(threadId: string) {
    this.client.off(apiRoutes.threadMessages(this.getId(), threadId));
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