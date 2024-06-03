import { Profile, Thread, ThreadMessage } from "@shared/models.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { AgentConfig, ModelProviderConfig } from "../../shared/models.ts";
import { defaultAgent } from "../agents/defaultAgent.ts";
import { fs } from "../tools/fs.ts";
import perf from "../tools/perf.ts";

export class AppDb {
  readonly workspaceDir: string;

  constructor(path: string) {
    this.workspaceDir = path;
  }

  private resolvePath(...paths: string[]): string {
    return join(this.workspaceDir, ...paths);
  }

  async getProfile(): Promise<Profile | null> {
    try {
      const profileStr = await fs.readTextFile(
        this.resolvePath("profile.json"),
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
    await fs.writeTextFile(
      this.resolvePath("profile.json"),
      JSON.stringify(profile),
    );

    return profile;
  }

  async getAgents(): Promise<AgentConfig[]> {
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
      agent.id === defaultAgent.id
    );
    if (defaultAgentIndex !== -1) {
      const overrideForDefaultAgent = JSON.parse(await fs.readTextFile(agents[defaultAgentIndex])) as AgentConfig;

      // Merge the default agent config with the overriding config
      configs[defaultAgentIndex] = {
        ...defaultAgent,
        ...overrideForDefaultAgent,
      };
    } else {
      // If there is no overriding config, just use the default agent
      configs.push(defaultAgent);
    }

    return configs;
  }

  async getAgent(agentId: string): Promise<AgentConfig | null> {
    await fs.ensureDir(this.resolvePath("agent-configs"));

    try {
      const agentStr = await fs.readTextFile(
        this.resolvePath("agent-configs", agentId, "_config.json"),
      );

      if (agentId === "default") {
        return {
          ...defaultAgent,
          ...JSON.parse(agentStr),
        };
      }

      if (agentStr) {
        return JSON.parse(agentStr);
      }

      return null;
    } catch (_) {
      if (agentId === "default") {
        return defaultAgent;
      }

      return null;
    }
  }

  async deleteAgent(agentId: string): Promise<void> {
    try {
      await fs.remove(this.resolvePath("agent-configs", agentId), {
        recursive: true,
      });
    } catch (error) {
      console.error("Couldn't remove the agent", error);
    }
  }

  async insertAgent(agent: AgentConfig): Promise<AgentConfig> {
    await fs.ensureDir(this.resolvePath("agent-configs", agent.id));

    await fs.writeTextFile(
      this.resolvePath("agent-configs", agent.id, "_config.json"),
      JSON.stringify(agent),
    );

    return agent;
  }

  async updateAgent(agent: AgentConfig): Promise<void> {
    await fs.ensureDir(this.resolvePath("agent-configs", agent.id));

    await fs.writeTextFile(
      this.resolvePath("agent-configs", agent.id, "_config.json"),
      JSON.stringify(agent),
    );
  }

  async createThread(thread: Thread): Promise<Thread> {
    // @TODO: make them async!
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
        return JSON.parse(threadStr);
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
      threads.push(JSON.parse(threadStr));
    }

    return threads;
  }

  private async getFiles(folderPath: string, targetFilename: string): Promise<string[]> {
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
