import { Profile, Thread, ThreadMessage } from "@shared/models.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import {
  AppConfig,
  ModelProviderConfig,
  Workspace,
} from "@shared/models.ts";
import { defaultChatAppConfig } from "../apps/defaultChatAppConfig.ts";
import { fs } from "../tools/fs.ts";
import perf from "../tools/perf.ts";
import { ThreadMigration } from "../migrations/threadMigration.ts";
import { migrateWorkspace } from "../migrations/workspaceMigration.ts";
import { CURRENT_DATA_VERSION } from "@shared/versions/dataVersions.ts";
import { v4 as uuidv4 } from "npm:uuid";

export async function loadWorkspace(path: string): Promise<Workspace | null> {
  const pathToWorkspace = path + "/_workspace.json";

  if (!await fs.fileExists(pathToWorkspace)) {
    return null;
  }

  const file = await fs.readTextFile(pathToWorkspace);
  let workspace = JSON.parse(file) as Workspace;

  if (!workspace.id || !workspace.createdAt) {
    return null;
  }

  // The file doesn't suppose to have the path, so we're adding it here after loading the file
  workspace.path = path;

  workspace = await migrateWorkspace(workspace);

  return workspace;
}

export async function createWorkspace(path: string): Promise<Workspace> {
  // Check if path exists
  if (!await fs.dirExists(path)) {
    throw new Error(`Directory ${path} does not exist`);
  }

  // Check if it's already a workspace
  const existingWorkspace = await loadWorkspace(path);
  if (existingWorkspace) {
    return existingWorkspace;
  }

  // Create a new workspace
  const workspaceJsonPath = path + "/_workspace.json";
  const workspace: Workspace = {
    v: CURRENT_DATA_VERSION,
    id: uuidv4(),
    name: null,
    createdAt: new Date().getTime(),
    path: path,
    setup: true // Adding the missing 'setup' property
  };

  await fs.writeTextFile(workspaceJsonPath, JSON.stringify(workspace));

  return workspace;
}

/*
// @TODO: Reference this old implementation if we need it again

export async function createWorkspaceInDocuments() {
  const homeDir = Deno.env.get("HOME");
  if (homeDir === undefined) {
    throw new Error("HOME environment variable is not set");
  }

  const iCloudPath = homeDir + "/Library/Mobile Documents/com~apple~CloudDocs";
  const documentsPath = homeDir + "/Documents";

  let dir: string;

  if (await fs.dirExists(iCloudPath)) {
    dir = iCloudPath;
  } else if (await fs.dirExists(documentsPath)) {
    dir = documentsPath;
  } else {
    throw new Error("Neither iCloud nor Documents directory exists");
  }

  return await checkAndCreateWorkspaceDir(dir);
}

async function checkAndCreateWorkspaceDir(rootDir: string): Promise<Workspace> {
  workspacePath = rootDir + "/Supamind/workspace";
  const workspaceExists = await fs.dirExists(workspacePath);
  let workspace: Workspace;
  if (!workspaceExists) {
    await fs.mkdir(workspacePath, { recursive: true });
    const workspaceJsonPath = workspacePath + "/_workspace.json";

    workspace = {
      id: uuidv4(),
      name: null,
      createdAt: new Date().getTime(),
    } as Workspace;

    await fs.writeTextFile(workspaceJsonPath, JSON.stringify(workspace));

    // We're adding the path later here because the workspace file doesn't need to have it.
    workspace.path = workspacePath;

  } else {
    const workspaceJsonPath = workspacePath + "/_workspace.json";
    const workspaceJson = await fs.readTextFile(workspaceJsonPath);
    workspace = JSON.parse(workspaceJson) as Workspace;

    if (!workspace.id || !workspace.createdAt) {
      throw new Error("Workspace is not valid");
    }

    // The file doesn't suppose to have path, so we're adding it here after loading the file
    workspace.path = workspacePath;
  }

  return workspace;
}
*/

/*
// @TODO: Reference this old implementation of writing the session file if we need it again

import { Workspace } from "../shared/models.ts";
import { neoRouter } from "./main.ts";
import { fs } from "./tools/fs.ts";
import { v4 as uuidv4 } from "npm:uuid";


let workspacePath: string | null = null;

export async function setWorkspacePath(path: string) {
  workspacePath = path;

  await writeSessionFile();
}

const SESSIONS_DIR = "/sessions";

const sessionId = uuidv4();

type Session = {
  id: string;
  startedAt: Date;
  updatedAt: Date;
};

async function writeSessionFile() {
  if (workspacePath === null) {
    return;
  }

  try {
    await fs.ensureDir(workspacePath + SESSIONS_DIR);

    const sessionFile = workspacePath + SESSIONS_DIR + "/" + sessionId +
      ".json";

    await fs.writeTextFile(
      sessionFile,
      JSON.stringify({
        id: sessionId,
        startedAt: new Date(),
        updatedAt: new Date(),
      } as Session),
    );
  } catch (e) {
    console.error(e);
    // @TODO: refactor, use one from backServices
    neoRouter.broadcastPost("session", {
      error: "fs-permission",
    });
  }
}

setInterval(async () => {
  await writeSessionFile();
}, 3000);
*/

export class WorkspaceDb {
  private threadMigration: ThreadMigration;

  constructor(readonly workspace: Workspace) {
    this.threadMigration = new ThreadMigration(this);
  }

  private resolvePath(...paths: string[]): string {
    // @TODO: don't rely on a package for this, just have a simple function doing this
    return join(this.workspace.path, ...paths);
  }

  async getProfile(): Promise<Profile | null> {
    try {
      await fs.ensureDir(this.resolvePath("users/root"));

      const profileStr = await fs.readTextFile(
        this.resolvePath("users/root", "root.json"), // @TODO: rename to _user.json (?)
      );

      if (profileStr) {
        return JSON.parse(profileStr);
      }

      return null;
    } catch (_) {
      return null;
    }
  }

  async insertProfile(profile: Profile): Promise<Profile> {
    await fs.ensureDir(this.resolvePath("users/root"));

    await fs.writeTextFile(
      this.resolvePath("users/root", "_user.json"),
      JSON.stringify(profile),
    );

    return profile;
  }

  async getAppConfigs(): Promise<AppConfig[]> {
    await fs.ensureDir(this.resolvePath("agent-configs"));
    const agents = await this.getFiles(
      this.resolvePath("agent-configs"),
      "_config.json",
    );

    const configs = await Promise.all(
      agents.map(async (agentFile) => {
        const agentStr = await fs.readTextFile(agentFile);
        return JSON.parse(agentStr);
      }),
    );

    const defaultAgentIndex = configs.findIndex((agent) =>
      agent.id === defaultChatAppConfig.id
    );
    if (defaultAgentIndex !== -1) {
      const overrideForDefaultAgent = JSON.parse(
        await fs.readTextFile(agents[defaultAgentIndex]),
      ) as AppConfig;

      // Merge the default agent config with the overriding config
      configs[defaultAgentIndex] = {
        ...defaultChatAppConfig,
        ...overrideForDefaultAgent,
      };
    } else {
      // If there is no overriding config, just use the default agent
      configs.push(defaultChatAppConfig);
    }

    return configs;
  }

  async getAppConfig(appConfigId: string): Promise<AppConfig | null> {
    await fs.ensureDir(this.resolvePath("agent-configs"));

    try {
      const appStr = await fs.readTextFile(
        this.resolvePath("agent-configs", appConfigId, "_config.json"),
      );

      if (appConfigId === "default") {
        return {
          ...defaultChatAppConfig,
          ...JSON.parse(appStr),
        };
      }

      if (appStr) {
        return JSON.parse(appStr);
      }

      return null;
    } catch (_) {
      if (appConfigId === "default") {
        return defaultChatAppConfig;
      }

      return null;
    }
  }

  async deleteAppConfig(appConfigId: string): Promise<void> {
    try {
      await fs.remove(this.resolvePath("agent-configs", appConfigId), {
        recursive: true,
      });
    } catch (error) {
      console.error("Couldn't remove the agent", error);
    }
  }

  async insertAppConfig(agent: AppConfig): Promise<AppConfig> {
    await fs.ensureDir(this.resolvePath("agent-configs", agent.id));

    await fs.writeTextFile(
      this.resolvePath("agent-configs", agent.id, "_config.json"),
      JSON.stringify(agent),
    );

    return agent;
  }

  async updateWorkspace(workspace: Workspace): Promise<Workspace> {
    const workspaceJsonPath = this.resolvePath("_workspace.json");

    if (!await fs.fileExists(workspaceJsonPath)) {
      throw new Error(`Workspace at ${this.workspace.path} does not exist`);
    }

    // We exlude the path from the saved workspace JSON because we add it dynamically when loading the workspace
    const workspaceWithoutPath = { ...workspace, path: undefined };

    await fs.writeTextFile(workspaceJsonPath, JSON.stringify(workspaceWithoutPath));

    return workspace;
  }

  async updateAppConfig(agent: AppConfig): Promise<void> {
    await fs.ensureDir(this.resolvePath("agent-configs", agent.id));

    await fs.writeTextFile(
      this.resolvePath("agent-configs", agent.id, "_config.json"),
      JSON.stringify(agent),
    );
  }

  async createThread(thread: Thread): Promise<Thread> {
    await fs.ensureDir(this.resolvePath(`threads/${thread.id}`));

    // Create a file with id of the thread and a folder with the same id for messages
    await fs.writeTextFile(
      this.resolvePath(`threads/${thread.id}/_thread.json`),
      JSON.stringify(thread),
    );
    await fs.ensureDir(this.resolvePath("threads", thread.id));

    return thread;
  }

  async deleteThread(threadId: string): Promise<void> {
    try {
      await fs.remove(this.resolvePath("threads", threadId), {
        recursive: true,
      });
    } catch (error) {
      console.error("Couldn't remove the thread", error);
    }
  }

  async getThread(threadId: string): Promise<Thread | null> {
    await fs.ensureDir(this.resolvePath(`threads/${threadId}`));

    try {
      const threadStr = await fs.readTextFile(
        this.resolvePath(`threads/${threadId}/_thread.json`),
      );

      if (threadStr) {
        const threadObj = JSON.parse(threadStr);
        const thread = this.threadMigration.migrateThread(threadObj);
        return thread;
      }

      return null;
    } catch (_) {
      return null;
    }
  }

  async updateThread(thread: Thread): Promise<void> {
    await fs.ensureDir(this.resolvePath(`threads/${thread.id}`));

    await fs.writeTextFile(
      this.resolvePath(`threads/${thread.id}/_thread.json`),
      JSON.stringify(thread),
    );
  }

  async getThreads(): Promise<Thread[]> {
    await fs.ensureDir(this.resolvePath("threads"));

    const threadFiles = await this.getFiles(
      this.resolvePath("threads"),
      "_thread.json",
    );
    const threads: Thread[] = [];

    for (const threadFile of threadFiles) {
      const threadStr = await fs.readTextFile(threadFile);
      const threadObj = JSON.parse(threadStr);
      threads.push(await this.threadMigration.migrateThread(threadObj));
    }

    return threads;
  }

  private async getFiles(
    folderPath: string,
    targetFilename: string,
  ): Promise<string[]> {
    const threadFiles: string[] = [];
    const entries = await fs.readDir(folderPath);

    for (const entry of entries) {
      const entryPath = folderPath + "/" + entry.name;

      if (entry.isFile && entry.name === targetFilename) {
        threadFiles.push(entryPath);
      } else if (entry.isDirectory) {
        const subThreadFiles = await this.getFiles(entryPath, targetFilename);
        threadFiles.push(...subThreadFiles);
      }
    }

    return threadFiles;
  }

  async createThreadMessage(
    threadId: string,
    message: ThreadMessage,
  ): Promise<ThreadMessage> {
    await fs.ensureDir(this.resolvePath("threads", threadId));

    // Create a file with the id of the message
    await fs.writeTextFile(
      this.resolvePath("threads", threadId, `${message.id}.json`),
      JSON.stringify(message),
    );

    return message;
  }

  async checkThreadMessage(
    threadId: string,
    messageId: string,
  ): Promise<boolean> {
    try {
      await fs.readTextFile(
        this.resolvePath("threads", threadId, `${messageId}.json`),
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  async updateThreadMessage(
    threadId: string,
    message: ThreadMessage,
  ): Promise<void> {
    await fs.writeTextFile(
      this.resolvePath("threads", threadId, `${message.id}.json`),
      JSON.stringify(message),
    );
  }

  async getThreadMessages(threadId: string): Promise<ThreadMessage[]> {
    const messageFiles = await fs.readDir(
      this.resolvePath("threads", threadId),
    );

    const messages: ThreadMessage[] = [];

    const readMessagesPromises: Promise<string>[] = [];
    for (const messageFile of messageFiles) {
      if (messageFile.isFile && messageFile.name.endsWith(".json")) {
        if (messageFile.name === "_thread.json") {
          continue;
        }

        const path = this.resolvePath("threads", threadId, messageFile.name);

        readMessagesPromises.push(fs.readTextFile(path));
      }
    }

    let p = perf("Reading all files");
    const messageStrings = await Promise.all(readMessagesPromises);
    p.stop();

    for (const messageStr of messageStrings) {
      try {
        const message = JSON.parse(messageStr);
        messages.push(message);
      } catch {
        console.error("Invalid message file");
      }
    }

    messages.sort((a, b) => a.createdAt - b.createdAt);

    return messages;
  }

  async deleteThreadMessage(
    threadId: string,
    messageId: string,
  ): Promise<void> {
    await fs.remove(
      this.resolvePath("threads", threadId, `${messageId}.json`),
    );
  }

  async getModelProviders(): Promise<ModelProviderConfig[]> {
    await fs.ensureDir(this.resolvePath("provider-configs"));

    const providerFiles = await fs.readDir(
      this.resolvePath("provider-configs"),
    );

    const providers: ModelProviderConfig[] = [];

    for (const providerFile of providerFiles) {
      if (providerFile.isFile && providerFile.name.endsWith(".json")) {
        const providerStr = await fs.readTextFile(
          this.resolvePath("provider-configs", providerFile.name),
        );
        try {
          providers.push(JSON.parse(providerStr));
        } catch {
          console.error("Invalid provider file", providerFile.name);
        }
      }
    }

    return providers;
  }

  async getProviderConfig(
    providerId: string,
  ): Promise<ModelProviderConfig | null> {
    await fs.ensureDir(this.resolvePath("provider-configs"));

    try {
      const providerStr = await fs.readTextFile(
        this.resolvePath("provider-configs", `${providerId}.json`),
      );

      if (providerStr) {
        return JSON.parse(providerStr);
      }

      return null;
    } catch (_) {
      return null;
    }
  }

  async deleteProviderConfig(providerId: string): Promise<void> {
    await fs.remove(
      this.resolvePath("provider-configs", `${providerId}.json`),
    );
  }

  async insertProviderConfig(
    provider: ModelProviderConfig,
  ): Promise<ModelProviderConfig> {
    await fs.ensureDir(this.resolvePath("provider-configs"));

    await fs.writeTextFile(
      this.resolvePath("provider-configs", `${provider.id}.json`),
      JSON.stringify(provider),
    );

    return provider;
  }
}
